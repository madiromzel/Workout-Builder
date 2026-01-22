<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

header("Content-Type: application/json");

$host = "localhost";
$user = "root";
$pass = "";
$db   = "hardmode";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
  echo json_encode([
    "status" => "error",
    "message" => "Database connection failed"
  ]);
  exit;
}
?>
