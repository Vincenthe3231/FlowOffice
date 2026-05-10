<?php

/**
 * Vercel Entry Point for Laravel
 * 
 * This file must be in the 'api/' directory for Vercel functions.
 * We manually set the script name to ensure Laravel's router handles
 * the '/api' prefix correctly.
 */

$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

require __DIR__ . '/../public/index.php';
