<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

require "db.php";

$result = $conn->query("SELECT * FROM tasks ORDER BY id DESC");
$tasks = [];

while ($row = $result->fetch_assoc()) {
  $tasks[] = $row;
}

echo json_encode([
  "status" => "success",
  "data" => $tasks
]);
