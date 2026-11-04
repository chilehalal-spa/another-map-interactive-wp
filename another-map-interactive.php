<?php
/**
 * Plugin Name: Another Map Interactive
 * Description: Interactive D3.js World Tour mapping plugin using orthographic projection and spherical linear interpolation.
 * Version: 1.1.0
 * Author: Development Team
 * Text Domain: another-map-interactive
 * Requires at least: 5.8
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Update URI: https://github.com/chilehalal-spa/another-map-interactive-wp
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Actualizaciones desde las releases de GitHub
require_once __DIR__ . '/includes/class-chilehalal-github-updater.php';
Chilehalal_GitHub_Updater_V1::register( __FILE__, 'chilehalal-spa/another-map-interactive-wp' );

require_once plugin_dir_path( __FILE__ ) . 'includes/class-another-map-interactive.php';

function run_another_map_interactive() {
    $plugin = new Another_Map_Interactive();
    $plugin->init();
}

run_another_map_interactive();