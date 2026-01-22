<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

require "db.php";

$input = json_decode(file_get_contents("php://input"), true);
$id   = $input["id"] ?? null;
$task = $input["task"] ?? "";

if (!$id || !$task) {
  echo json_encode(["status" => "error", "message" => "Invalid input"]);
  exit;
}

$stmt = $conn->prepare("UPDATE tasks SET task=? WHERE id=?");
$stmt->bind_param("si", $task, $id);
$stmt->execute();

echo json_encode([
  "status" => "success",
  "message" => "Task updated"
]);
