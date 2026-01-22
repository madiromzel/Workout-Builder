<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

require "db.php";

$input = json_decode(file_get_contents("php://input"), true);
$id = $input["id"] ?? null;

if (!$id) {
  echo json_encode(["status" => "error", "message" => "ID required"]);
  exit;
}

$stmt = $conn->prepare("DELETE FROM tasks WHERE id=?");
$stmt->bind_param("i", $id);
$stmt->execute();

echo json_encode([
  "status" => "success",
  "message" => "Task deleted"
]);
