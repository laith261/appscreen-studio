<?php
/**
 * Project storage API — one JSON file per project in ../projects/
 *   GET                 → list of projects (meta + thumbnail, newest first)
 *   GET    ?id=<id>     → full project
 *   POST   ?id=<id>     → save project (JSON body: { project, thumbnail })
 *   DELETE ?id=<id>     → delete project
 */
header('Content-Type: application/json');

$dir = __DIR__ . '/../projects';
if (!is_dir($dir)) @mkdir($dir, 0777, true);

function fail($code, $msg) {
  http_response_code($code);
  echo json_encode(['error' => $msg]);
  exit;
}

$id = $_GET['id'] ?? null;
// Strict id format keeps requests inside the projects folder
if ($id !== null && !preg_match('/^[a-z0-9-]{1,64}$/', $id)) fail(400, 'Invalid project id');
$file = $id ? "$dir/$id.json" : null;

switch ($_SERVER['REQUEST_METHOD']) {
  case 'GET':
    if ($file) {
      if (!is_file($file)) fail(404, 'Project not found');
      readfile($file);
      break;
    }
    $list = [];
    foreach (glob("$dir/*.json") as $f) {
      $data = json_decode(file_get_contents($f), true);
      if (!$data) continue;
      $list[] = [
        'id' => basename($f, '.json'),
        'name' => $data['project']['projectName'] ?? 'Untitled',
        'screens' => count($data['project']['screens'] ?? []),
        'languages' => $data['project']['languages'] ?? ['en'],
        'updated' => filemtime($f),
        'thumbnail' => $data['thumbnail'] ?? null,
      ];
    }
    usort($list, fn($a, $b) => $b['updated'] <=> $a['updated']);
    echo json_encode($list);
    break;

  case 'POST':
    if (!$file) fail(400, 'Missing project id');
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);
    if (!isset($data['project']['screens'])) fail(400, 'Invalid project data');
    // Write to a temp file then rename so a crash never leaves a half-written project
    $tmp = "$file.tmp";
    if (@file_put_contents($tmp, $body, LOCK_EX) === false || !@rename($tmp, $file)) {
      fail(500, 'Could not write project file: the web server needs write access to the projects folder (chmod 777 projects)');
    }
    echo json_encode(['ok' => true, 'updated' => filemtime($file)]);
    break;

  case 'DELETE':
    if (!$file || !is_file($file)) fail(404, 'Project not found');
    unlink($file);
    echo json_encode(['ok' => true]);
    break;

  default:
    fail(405, 'Method not allowed');
}
