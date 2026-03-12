<?php
// api/index.php
require_once 'config.php';

// Získání endpointu z URL parametru (?action=...)
$action = isset($_GET['action']) ? $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];

// Přečtení JSON těla (pokud je nějaké posláno přes POST/PUT)
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

// --- POMOCNÉ FUNKCE PRO AUTORIZACI (Jednoduché JWT-like ověření přes hlavičky, resp. jednoduchý token) ---
// V produkci by se měl použít JWT, zde je pro ukázku jednodušší implementace vracející "user_id-email-hash"
function getBearerToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function verifyUser($mysqli) {
    $token = getBearerToken();
    if (!$token) sendError('Unauthorized - chybí token', 401);
    
    // Náš mock "token" vypadá například jako base64_encode(user_id:email)
    $decoded = base64_decode($token);
    if (!$decoded || !str_contains($decoded, ':')) sendError('Neplatný token', 401);
    
    list($id, $email) = explode(':', $decoded, 2);
    $stmt = $mysqli->prepare("SELECT id, email, first_name, last_name, role, status FROM users WHERE id = ? AND email = ?");
    $stmt->bind_param("is", $id, $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) sendError('Neplatný uživatel', 401);
    if ($user['status'] === 'blocked') sendError('Tento účet byl zablokován.', 403);
    
    return $user;
}

// ------ ROUTING ------

switch ($action) {
    // 1. AUTORIZACE
    case 'auth/login':
        if ($method !== 'POST') sendError('Jen POST.', 405);
        if (empty($input['email']) || empty($input['password'])) sendError('Chybí email nebo heslo.');
        
        $email = $input['email'];
        $pass = $input['password'];
        
        $stmt = $mysqli->prepare("SELECT id, password_hash, first_name, last_name, email, role FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        
        if ($user && password_verify($pass, $user['password_hash'])) {
            // Generování primitivního "tokenu" (V PRODUKCI POUŽÍT opravdové JWT knihovny jako firebase/php-jwt)
            $token = base64_encode($user['id'] . ':' . $user['email']);
            sendResponse([
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['first_name'] . ' ' . $user['last_name'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ],
                'token' => $token
            ]);
        } else {
            sendError('Neplatný e-mail nebo heslo.');
        }
        break;

    case 'auth/register':
        if ($method !== 'POST') sendError('Jen POST.', 405);
        if ($input['password'] !== $input['confirm']) sendError('Hesla se neshodují.');
        
        $email = $input['email'];
        if (!preg_match('/@(czu\.cz|studenti\.czu\.cz)$/i', $email)) {
            sendError('Zadejte školní e-mail.');
        }
        
        $hash = password_hash($input['password'], PASSWORD_DEFAULT);
        
        try {
            $stmt = $mysqli->prepare("INSERT INTO users (email, password_hash, first_name, last_name, gender) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("sssss", $email, $hash, $input['firstName'], $input['lastName'], $input['gender']);
            $stmt->execute();
            
            $newId = $stmt->insert_id;
            $token = base64_encode($newId . ':' . $email);
            
            sendResponse([
                'user' => [
                    'id' => $newId,
                    'name' => $input['firstName'] . ' ' . $input['lastName'],
                    'email' => $email,
                    'role' => 'student'
                ],
                'token' => $token
            ]);
        } catch (mysqli_sql_exception $e) {
            if ($e->getCode() == 1062) { // Záznam už existuje (UNIQUE KEY email)
                sendError('E-mail je již zaregistrován.');
            }
            sendError('Chyba databáze.');
        }
        break;

    case 'rides':
        if ($method === 'GET') {
            $id = isset($_GET['id']) ? intval($_GET['id']) : null;
            $featured = isset($_GET['featured']) ? true : false;

            $sql = "SELECT r.*, u.first_name, u.last_name, u.email, v.brand, v.model, v.plate,
                    (SELECT COUNT(*) FROM ride_requests rr WHERE rr.ride_id = r.id AND rr.status = 'approved') as taken_seats
                    FROM rides r 
                    JOIN users u ON r.driver_id = u.id 
                    JOIN vehicles v ON r.vehicle_id = v.id 
                    WHERE r.status = 'active'";
            
            if ($id) {
                $sql .= " AND r.id = $id";
            }
            
            $sql .= " ORDER BY r.departure ASC";

            if ($featured) {
                $sql .= " LIMIT 3";
            }

            $res = $mysqli->query($sql);
            $rides = [];
            while ($row = $res->fetch_assoc()) {
                $rides[] = [
                    'id' => $row['id'],
                    'from' => $row['origin'],
                    'to' => $row['destination'],
                    'departure' => $row['departure'],
                    'price' => $row['price'],
                    'currency' => 'Kč',
                    'availableSeats' => max(0, $row['capacity'] - $row['taken_seats']),
                    'duration' => $row['duration'],
                    'distance' => 'Spolujízda', // Dummy
                    'meetingPoint' => 'Dle domluvy',
                    'description' => $row['notes'] ?: 'Bez poznámek.',
                    'tags' => [], // Inicializace prázdných tagů
                    'reviews' => [], // Prázdné recenze defaultně
                    'driver' => [
                        'name' => $row['first_name'] . ' ' . $row['last_name'],
                        'car' => $row['brand'] . ' ' . $row['model'],
                        'color' => 'Nezadáno', // Fallback, we should join color but hardcoding for safety right now if missing
                        'plate' => $row['plate'],
                        'rating' => 5,
                        'trips' => 12, // mock
                        'bio' => 'Student ČZU.',
                        'initials' => 'SK' // mock
                    ]
                ];
                
                // Načtení tagů pro danou jízdu
                $tagSql = "SELECT t.name FROM tags t JOIN ride_tags rt ON t.id = rt.tag_id WHERE rt.ride_id = " . $row['id'];
                $tagRes = $mysqli->query($tagSql);
                while ($tagRow = $tagRes->fetch_assoc()) {
                    $rides[count($rides)-1]['tags'][] = $tagRow['name'];
                }
            }
            if ($id) {
                sendResponse(count($rides) > 0 ? $rides[0] : null);
            } else {
                sendResponse($rides);
            }
        }
        elseif ($method === 'POST') {
            $user = verifyUser($mysqli); // Chráněný přístup
            if (!isset($input['from']) || !isset($input['to'])) sendError('Chybná data cesty.');
            
            // Ověříme, zdali uživatel předal vybrané ID vozidla
            $vehicle_id = (!empty($input['car']) && is_numeric($input['car'])) ? intval($input['car']) : null;
            if (!$vehicle_id) {
                $stmt = $mysqli->prepare("SELECT id FROM vehicles WHERE user_id = ? LIMIT 1");
                $stmt->bind_param("i", $user['id']);
                $stmt->execute();
                $res = $stmt->get_result();
                if ($row = $res->fetch_assoc()) {
                    $vehicle_id = $row['id'];
                } else {
                    $stmt = $mysqli->prepare("INSERT INTO vehicles (user_id, brand, model, plate, color, engine_type) VALUES (?, 'Škoda', 'Neznámý model', '1AA 0000', 'Nezadáno', 'benzin')");
                    $stmt->bind_param("i", $user['id']);
                    $stmt->execute();
                    $vehicle_id = $stmt->insert_id;
                }
            }

            // Ošetření odlišností názvosloví posílaného JS objektem a defaultů
            $datetime_str = isset($input['departure']) ? str_replace('T', ' ', $input['departure']) . ':00' : date('Y-m-d H:i:s');
            $capacity = isset($input['capacity']) ? intval($input['capacity']) : 3;
            $price = isset($input['price']) ? floatval($input['price']) : 0.0;
            $notes = isset($input['notes']) ? trim($input['notes']) : '';
            $duration = isset($input['duration']) ? trim($input['duration']) : null;

            try {
                $stmt = $mysqli->prepare("INSERT INTO rides (driver_id, vehicle_id, direction, origin, destination, departure, capacity, price, notes, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("iissssidss", 
                    $user['id'], 
                    $vehicle_id, 
                    $input['direction'], 
                    $input['from'], 
                    $input['to'], 
                    $datetime_str, 
                    $capacity, 
                    $price, 
                    $notes,
                    $duration
                );
                $stmt->execute();
                $last_ride_id = $stmt->insert_id;

                // POST Ukládání přidaných tagů!
                if (!empty($input['tags'])) {
                    $tagsArr = explode(',', $input['tags']);
                    foreach ($tagsArr as $tag) {
                        $tag = trim($tag);
                        if(empty($tag)) continue;
                        
                        // Zkontrolujeme nebo přidáme tag do tabulky tags
                        $stmtTag = $mysqli->prepare("SELECT id FROM tags WHERE name = ?");
                        $stmtTag->bind_param("s", $tag);
                        $stmtTag->execute();
                        $tagRes = $stmtTag->get_result();
                        if ($tRow = $tagRes->fetch_assoc()) {
                            $tag_id = $tRow['id'];
                        } else {
                            $stmtIns = $mysqli->prepare("INSERT INTO tags (name) VALUES (?)");
                            $stmtIns->bind_param("s", $tag);
                            $stmtIns->execute();
                            $tag_id = $stmtIns->insert_id;
                        }
                        
                        // Zapsání do vazební tabulky ride_tags
                        $stmtLink = $mysqli->prepare("INSERT INTO ride_tags (ride_id, tag_id) VALUES (?, ?)");
                        $stmtLink->bind_param("ii", $last_ride_id, $tag_id);
                        $stmtLink->execute();
                    }
                }
                
                sendResponse(['id' => $last_ride_id, 'status' => 'active']);
            } catch (mysqli_sql_exception $e) {
                sendError('Chyba při ukládání jízdy do databáze (SQL Error).');
            }
        }
        break;

    // 3. UŽIVATELSKÝ PROFIL A VOZIDLA
    case 'user/account':
        if ($method !== 'GET') sendError('Jen GET.', 405);
        $user = verifyUser($mysqli);
        
        // Získání aut uživatele
        $res = $mysqli->query("SELECT id, brand, model, plate, engine_type as engine, color FROM vehicles WHERE user_id = {$user['id']}");
        if (!$res) sendError('Chyba DB (Vozidla): ' . $mysqli->error);
        $vehicles = [];
        while ($row = $res->fetch_assoc()) {
            $vehicles[] = $row;
        }

        // Získání jízd (jako řidič)
        $res = $mysqli->query("SELECT id, origin, destination, departure, status, capacity FROM rides WHERE driver_id = {$user['id']} ORDER BY departure DESC");
        $driverRides = [];
        while ($row = $res->fetch_assoc()) {
            $driverRides[] = [
                'id' => $row['id'],
                'title' => $row['origin'] . ' → ' . $row['destination'],
                'date' => $row['departure'],
                'status' => $row['status'] == 'active' ? 'Plánováno' : 'Dokončeno',
                'seats' => $row['capacity'] . ' míst'
            ];
        }

        sendResponse([
            'name' => $user['first_name'] . ' ' . $user['last_name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'rating' => 5, // Lze doplnit dotaz na review tabulku
            'vehicles' => $vehicles,
            'driverRides' => $driverRides,
            'passengerRides' => [] // Do budoucna žadatelé z tabulky ride_requests
        ]);
        break;

    case 'user/vehicles':
        $user = verifyUser($mysqli);
        if ($method === 'GET') {
            $res = $mysqli->query("SELECT id, brand, model, plate, color, engine_type as engine FROM vehicles WHERE user_id = {$user['id']}");
            $vehicles = [];
            while ($row = $res->fetch_assoc()) {
                $vehicles[] = $row;
            }
            sendResponse($vehicles);
        } elseif ($method === 'POST') {
            if (empty($input['brand']) || empty($input['model'])) sendError('Chybí data vozidla');
            $color = !empty($input['color']) ? $input['color'] : 'Nezadáno';
            $engine = !empty($input['engine']) ? $input['engine'] : 'benzin';
            
            $stmt = $mysqli->prepare("INSERT INTO vehicles (user_id, brand, model, plate, color, engine_type) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("isssss", $user['id'], $input['brand'], $input['model'], $input['plate'], $color, $engine);
            $stmt->execute();
            sendResponse([
                'id' => $stmt->insert_id,
                'brand' => $input['brand'],
                'model' => $input['model'],
                'plate' => $input['plate'],
                'color' => $color,
                'engine' => $input['engine']
            ]);
        }
        break;

    // 4. ŽÁDOSTI O MÍSTO
    case 'rides/request':
        if ($method === 'POST') {
            $user = verifyUser($mysqli);
            if (empty($input['rideId'])) sendError('Chybí ID jízdy.');
            
            $ride_id = intval($input['rideId']);
            $message = isset($input['message']) ? trim($input['message']) : '';
            
            // Ověření, že jízda existuje a uživatel není její řidič
            $check = $mysqli->query("SELECT driver_id FROM rides WHERE id = $ride_id AND status = 'active'");
            if (!$check || $check->num_rows === 0) sendError('Jízda neexistuje nebo již není aktivní.');
            $ride = $check->fetch_assoc();
            if ($ride['driver_id'] == $user['id']) sendError('Nemůžeš žádat o místo ve vlastní jízdě.');
            
            // Ověření duplicity
            $dupCheck = $mysqli->prepare("SELECT id FROM ride_requests WHERE ride_id = ? AND passenger_id = ?");
            $dupCheck->bind_param("ii", $ride_id, $user['id']);
            $dupCheck->execute();
            if ($dupCheck->get_result()->num_rows > 0) sendError('Žádost o tuto jízdu jsi již odeslal.');
            
            $stmt = $mysqli->prepare("INSERT INTO ride_requests (ride_id, passenger_id, message) VALUES (?, ?, ?)");
            $stmt->bind_param("iis", $ride_id, $user['id'], $message);
            $stmt->execute();
            
            sendResponse(['id' => $stmt->insert_id, 'status' => 'pending']);
        }
        break;

    case 'rides/request/respond':
        if ($method !== 'POST') sendError('Jen POST.', 405);
        $user = verifyUser($mysqli);
        
        if (empty($input['requestId']) || empty($input['status'])) sendError('Chybí ID žádosti nebo stav.');
        if (!in_array($input['status'], ['approved', 'rejected'])) sendError('Neplatný stav. Použij approved nebo rejected.');
        
        $request_id = intval($input['requestId']);
        $new_status = $input['status'];
        
        // Ověření, že žádost patří k jízdě tohoto řidiče
        $stmt = $mysqli->prepare("SELECT rr.id, r.driver_id FROM ride_requests rr JOIN rides r ON rr.ride_id = r.id WHERE rr.id = ?");
        $stmt->bind_param("i", $request_id);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        if (!$result) sendError('Žádost nenalezena.');
        if ($result['driver_id'] != $user['id']) sendError('Nemáš oprávnění reagovat na tuto žádost.', 403);
        
        $stmt = $mysqli->prepare("UPDATE ride_requests SET status = ? WHERE id = ?");
        $stmt->bind_param("si", $new_status, $request_id);
        $stmt->execute();
        
        sendResponse(['requestId' => $request_id, 'status' => $new_status]);
        break;

    // 5. MOJE JÍZDY (pro stránku my-rides.html)
    case 'user/my-rides':
        if ($method !== 'GET') sendError('Jen GET.', 405);
        $user = verifyUser($mysqli);
        $uid = $user['id'];
        
        // A) Jízdy jako řidič (aktivní + plné)
        $res = $mysqli->query("SELECT r.*, v.brand, v.model, v.plate FROM rides r JOIN vehicles v ON r.vehicle_id = v.id WHERE r.driver_id = $uid AND r.status IN ('active','full') ORDER BY r.departure ASC");
        $driverRides = [];
        while ($row = $res->fetch_assoc()) {
            $ride = [
                'id' => $row['id'],
                'from' => $row['origin'],
                'to' => $row['destination'],
                'departure' => $row['departure'],
                'capacity' => $row['capacity'],
                'price' => $row['price'],
                'duration' => $row['duration'],
                'status' => $row['status'],
                'car' => $row['brand'] . ' ' . $row['model'],
                'plate' => $row['plate'],
                'requests' => []
            ];
            
            // Žádosti o tuto jízdu
            $reqRes = $mysqli->query("SELECT rr.id, rr.message, rr.status, rr.created_at, u.first_name, u.last_name, u.email FROM ride_requests rr JOIN users u ON rr.passenger_id = u.id WHERE rr.ride_id = {$row['id']} ORDER BY rr.created_at DESC");
            while ($rr = $reqRes->fetch_assoc()) {
                $ride['requests'][] = [
                    'id' => $rr['id'],
                    'passengerName' => $rr['first_name'] . ' ' . $rr['last_name'],
                    'passengerEmail' => $rr['email'],
                    'message' => $rr['message'],
                    'status' => $rr['status'],
                    'createdAt' => $rr['created_at']
                ];
            }
            
            $driverRides[] = $ride;
        }
        
        // B) Jízdy jako pasažér (aktivní žádosti)
        $res = $mysqli->query("SELECT rr.id as request_id, rr.message as my_message, rr.status as request_status, rr.created_at, r.id as ride_id, r.origin, r.destination, r.departure, r.price, r.duration, r.status as ride_status, u.first_name, u.last_name FROM ride_requests rr JOIN rides r ON rr.ride_id = r.id JOIN users u ON r.driver_id = u.id WHERE rr.passenger_id = $uid AND r.status IN ('active','full') ORDER BY r.departure ASC");
        $passengerRides = [];
        while ($row = $res->fetch_assoc()) {
            $passengerRides[] = [
                'requestId' => $row['request_id'],
                'rideId' => $row['ride_id'],
                'from' => $row['origin'],
                'to' => $row['destination'],
                'departure' => $row['departure'],
                'price' => $row['price'],
                'duration' => $row['duration'],
                'driverName' => $row['first_name'] . ' ' . $row['last_name'],
                'myMessage' => $row['my_message'],
                'requestStatus' => $row['request_status'],
                'createdAt' => $row['created_at']
            ];
        }
        
        // C) Historie (dokončené/zrušené jízdy)
        $res = $mysqli->query("SELECT r.id, r.origin, r.destination, r.departure, r.price, r.duration, r.status, 'driver' as role FROM rides r WHERE r.driver_id = $uid AND r.status IN ('completed','cancelled')
            UNION ALL
            SELECT r.id, r.origin, r.destination, r.departure, r.price, r.duration, r.status, 'passenger' as role FROM ride_requests rr JOIN rides r ON rr.ride_id = r.id WHERE rr.passenger_id = $uid AND r.status IN ('completed','cancelled')
            ORDER BY departure DESC");
        $history = [];
        while ($row = $res->fetch_assoc()) {
            $history[] = [
                'rideId' => $row['id'],
                'from' => $row['origin'],
                'to' => $row['destination'],
                'departure' => $row['departure'],
                'price' => $row['price'],
                'duration' => $row['duration'],
                'status' => $row['status'],
                'role' => $row['role']
            ];
        }
        
        sendResponse([
            'driverRides' => $driverRides,
            'passengerRides' => $passengerRides,
            'history' => $history
        ]);
        break;

    // ======== 6. ADMIN ENDPOINTY ========
    case 'admin/stats':
        if ($method !== 'GET') sendError('Jen GET.', 405);
        $user = verifyUser($mysqli);
        if ($user['role'] !== 'admin') sendError('Přístup odepřen.', 403);
        
        $usersCount = $mysqli->query("SELECT COUNT(*) as c FROM users")->fetch_assoc()['c'];
        $ridesCount = $mysqli->query("SELECT COUNT(*) as c FROM rides WHERE status = 'active'")->fetch_assoc()['c'];
        $pendingCount = $mysqli->query("SELECT COUNT(*) as c FROM ride_requests WHERE status = 'pending'")->fetch_assoc()['c'];
        
        sendResponse([
            'usersCount' => $usersCount,
            'ridesCount' => $ridesCount,
            'pendingRequests' => $pendingCount
        ]);
        break;

    case 'admin/users':
        $user = verifyUser($mysqli);
        if ($user['role'] !== 'admin') sendError('Přístup odepřen.', 403);
        
        if ($method === 'GET') {
            $res = $mysqli->query("SELECT id, email, first_name, last_name, role, status, created_at FROM users ORDER BY created_at DESC");
            $users = [];
            while ($row = $res->fetch_assoc()) {
                $users[] = $row;
            }
            sendResponse($users);
        } elseif ($method === 'POST') {
            // Blokovat / odblokovat uživatele
            if (empty($input['userId']) || empty($input['action'])) sendError('Chybí userId nebo action.');
            $target_id = intval($input['userId']);
            $action = $input['action'];
            
            if ($action === 'block') {
                $mysqli->query("UPDATE users SET status = 'blocked' WHERE id = $target_id");
                sendResponse(['userId' => $target_id, 'status' => 'blocked']);
            } elseif ($action === 'unblock') {
                $mysqli->query("UPDATE users SET status = 'active' WHERE id = $target_id");
                sendResponse(['userId' => $target_id, 'status' => 'active']);
            } else {
                sendError('Neplatná akce. Použij block nebo unblock.');
            }
        }
        break;

    case 'admin/rides':
        $user = verifyUser($mysqli);
        if ($user['role'] !== 'admin') sendError('Přístup odepřen.', 403);
        
        if ($method === 'GET') {
            $res = $mysqli->query("SELECT r.id, r.origin, r.destination, r.departure, r.status, r.capacity, r.price, r.duration, u.email as driver_email, u.first_name, u.last_name FROM rides r JOIN users u ON r.driver_id = u.id ORDER BY r.departure DESC");
            $rides = [];
            while ($row = $res->fetch_assoc()) {
                $rides[] = $row;
            }
            sendResponse($rides);
        } elseif ($method === 'POST') {
            // Zrušit jízdu
            if (empty($input['rideId']) || empty($input['action'])) sendError('Chybí rideId nebo action.');
            $ride_id = intval($input['rideId']);
            if ($input['action'] === 'cancel') {
                $mysqli->query("UPDATE rides SET status = 'cancelled' WHERE id = $ride_id");
                sendResponse(['rideId' => $ride_id, 'status' => 'cancelled']);
            } else {
                sendError('Neplatná akce.');
            }
        }
        break;

    case 'admin/vehicles':
        $user = verifyUser($mysqli);
        if ($user['role'] !== 'admin') sendError('Přístup odepřen.', 403);
        
        if ($method === 'GET') {
            $res = $mysqli->query("SELECT v.id, v.brand, v.model, v.plate, v.color, v.engine_type, u.email as owner_email FROM vehicles v JOIN users u ON v.user_id = u.id ORDER BY v.created_at DESC");
            $vehicles = [];
            while ($row = $res->fetch_assoc()) {
                $vehicles[] = $row;
            }
            sendResponse($vehicles);
        } elseif ($method === 'POST') {
            // Smazat vozidlo
            if (empty($input['vehicleId'])) sendError('Chybí vehicleId.');
            $vid = intval($input['vehicleId']);
            $mysqli->query("DELETE FROM vehicles WHERE id = $vid");
            sendResponse(['deleted' => $vid]);
        }
        break;

    default:
        sendError('Neznámý API endpoint.', 404);
}
?>
