<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

echo json_encode([
  "status" => "success",
  "message" => "PHP API is running"
]);
