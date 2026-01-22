
<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

require "db.php";

$input = json_decode(file_get_contents("php://input"), true);
$task = $input["task"] ?? "";

if (!$task) {
  echo json_encode(["status" => "error", "message" => "Task required"]);
  exit;
}

$stmt = $conn->prepare("INSERT INTO tasks (task) VALUES (?)");
$stmt->bind_param("s", $task);
$stmt->execute();

echo json_encode([
  "status" => "success",
  "message" => "Task added"
]);
