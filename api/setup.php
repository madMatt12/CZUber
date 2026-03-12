<?php
// api/setup.php
require_once 'config.php';

echo "<h1>Instalace databáze FaremSpolu</h1>";

$queries = [
    // 1. Tabulka Uživatelů
    "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        gender ENUM('male', 'female', 'other') NOT NULL,
        role ENUM('student', 'admin') DEFAULT 'student',
        status ENUM('active', 'blocked') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    // 2. Tabulka Vozidel
    "CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        brand VARCHAR(50) NOT NULL,
        model VARCHAR(50) NOT NULL,
        color VARCHAR(30) NOT NULL,
        plate VARCHAR(20) NOT NULL,
        engine_type ENUM('benzin', 'diesel', 'lpg', 'electro', 'hybrid') NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    // 3. Tabulka Jízd
    "CREATE TABLE IF NOT EXISTS rides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        driver_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        direction ENUM('to', 'from') NOT NULL,
        origin VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        departure DATETIME NOT NULL,
        capacity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        notes TEXT,
        duration VARCHAR(20) NULL,
        status ENUM('active', 'full', 'completed', 'cancelled') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    // 4. Tabulka Žádostí o Jízdu
    "CREATE TABLE IF NOT EXISTS ride_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ride_id INT NOT NULL,
        passenger_id INT NOT NULL,
        message TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
        FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    // 5. Tabulka Tagů
    "CREATE TABLE IF NOT EXISTS tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    // 6. Vazební tabulka Jízdy a Tagy
    "CREATE TABLE IF NOT EXISTS ride_tags (
        ride_id INT NOT NULL,
        tag_id INT NOT NULL,
        PRIMARY KEY (ride_id, tag_id),
        FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    // 7. Tabulka Hodnocení
    "CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ride_id INT NOT NULL,
        reviewer_id INT NOT NULL,
        reviewee_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
];

foreach ($queries as $index => $query) {
    try {
        $mysqli->query($query);
        echo "<p style='color: green;'>Tabulka " . ($index + 1) . " úspěšně vytvořena / zkontrolována.</p>";
    }
    catch (Exception $e) {
        echo "<p style='color: red;'>Chyba při tvorbě tabulky " . ($index + 1) . ": " . $e->getMessage() . "</p>";
    }
}

// Přidání prvotních tagů pokud chybí
$defaultTags = ['Wi-Fi', 'Káva', 'Tichá jízda', 'Sdílené náklady', 'Hudba', 'USB nabíjení'];
foreach ($defaultTags as $tag) {
    try {
        $stmt = $mysqli->prepare("INSERT IGNORE INTO tags (name) VALUES (?)");
        $stmt->bind_param("s", $tag);
        $stmt->execute();
    }
    catch (Exception $e) {
    }
}
echo "<p style='color: green;'>Základní 'Tags' (vlastnosti jízd) byly naplněny do databáze.</p>";

// Přidání jednoho testovacího admin uživatele
try {
    $adminEmail = 'admin@czu.cz';
    $check = $mysqli->query("SELECT id FROM users WHERE email = '$adminEmail'");
    if ($check->num_rows === 0) {
        $hash = password_hash('Admin123', PASSWORD_DEFAULT);
        $mysqli->query("INSERT INTO users (email, password_hash, first_name, last_name, gender, role) VALUES ('$adminEmail', '$hash', 'Hlavní', 'Admin', 'other', 'admin')");
        echo "<p style='color: blue;'>Testovací admin byl vytvořen:<br>Email: <b>$adminEmail</b><br>Heslo: <b>Admin123</b></p>";
    }
}
catch (Exception $e) {
}

echo "<h3>Hotovo! Přejděte na web a po nahození API smažte nebo skryjte tento soubor (<code>api/setup.php</code>).</h3>";

// Migrace: přidání sloupce duration do existující tabulky rides (pokud ještě neexistuje)
try {
    $mysqli->query("ALTER TABLE rides ADD COLUMN duration VARCHAR(20) NULL");
    echo "<p style='color: green;'>Sloupec 'duration' přidán do tabulky rides.</p>";
} catch (Exception $e) {
    // Sloupec už existuje – ignorujeme
}
?>
