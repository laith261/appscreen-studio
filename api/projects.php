<?php
/**
 * AppScreen Studio - PHP API Bridge for XAMPP / Apache environments
 * Lists and deletes project JSON files created by MCP or AI agents in the workspace.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$rootDir = dirname(__DIR__);

// Handle file deletion
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' || isset($_GET['delete'])) {
    $file = $_GET['file'] ?? $_GET['delete'] ?? '';
    if (!empty($file) && str_ends_with($file, '.json') && !str_contains($file, 'package') && !str_contains($file, '..')) {
        $target = $rootDir . DIRECTORY_SEPARATOR . basename($file);
        if (file_exists($target)) {
            @unlink($target);
        }
        $svg = $rootDir . DIRECTORY_SEPARATOR . 'sample_screen_1.svg';
        if (str_contains($file, 'sample') && file_exists($svg)) {
            @unlink($svg);
        }
        $wp = $rootDir . DIRECTORY_SEPARATOR . 'workspace_projects.json';
        if (file_exists($wp)) {
            $wpData = json_decode(file_get_contents($wp), true);
            if (is_array($wpData)) {
                $filtered = array_values(array_filter($wpData, function($item) use ($file) {
                    return ($item['filename'] ?? '') !== $file && ($item['id'] ?? '') !== str_replace('.json', '', $file);
                }));
                file_put_contents($wp, json_encode($filtered, JSON_PRETTY_PRINT));
            }
        }
        echo json_encode(['success' => true, 'deleted' => $file]);
        exit;
    }
}

// Handle project listing
$files = scandir($rootDir);
$projects = [];

foreach ($files as $file) {
    if (str_ends_with($file, '.json') && 
        !str_contains($file, 'package') && 
        !str_contains($file, 'config') && 
        !str_starts_with($file, '.') &&
        $file !== 'workspace_projects.json') {
        
        $filePath = $rootDir . DIRECTORY_SEPARATOR . $file;
        if (is_file($filePath)) {
            $content = file_get_contents($filePath);
            $data = json_decode($content, true);
            if (is_array($data) && isset($data['projectName']) && isset($data['screens'])) {
                $projects[] = [
                    'id' => str_replace('.json', '', $file),
                    'filename' => $file,
                    'name' => $data['projectName'],
                    'screens' => count($data['screens']),
                    'languages' => $data['languages'] ?? ['en'],
                    'updated' => filemtime($filePath) * 1000,
                    'isFile' => true,
                    'fileUrl' => $file,
                    'badge' => 'AI / MCP',
                    'thumbnail' => file_exists($rootDir . '/sample_screen_1.svg') ? 'sample_screen_1.svg' : null
                ];
            }
        }
    }
}

echo json_encode($projects, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
