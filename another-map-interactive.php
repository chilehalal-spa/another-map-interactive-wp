<?php
/**
 * Plugin Name: Another Map Interactive
 * Description: Interactive D3.js World Tour mapping plugin using orthographic projection and spherical linear interpolation.
 * Version: 1.0.2
 * Author: Development Team
 * Text Domain: another-map-interactive
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once plugin_dir_path( __FILE__ ) . 'includes/class-another-map-interactive.php';

function run_another_map_interactive() {
    $plugin = new Another_Map_Interactive();
    $plugin->init();
}

run_another_map_interactive();