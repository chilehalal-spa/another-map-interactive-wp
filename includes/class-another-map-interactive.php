<?php

class Another_Map_Interactive {

    public function init() {
        add_shortcode( 'another_map_interactive', array( $this, 'render_shortcode' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'register_assets' ) );
    }

    public function register_assets() {
        wp_register_script( 'd3-js', 'https://d3js.org/d3.v7.min.js', array(), '7.8.5', true );
        wp_register_script( 'topojson-js', 'https://unpkg.com/topojson-client@3', array(), '3.1.0', true );
        
        wp_register_script( 
            'another-map-interactive-js', 
            plugin_dir_url( dirname( __FILE__ ) ) . 'assets/js/main.js', 
            array( 'd3-js', 'topojson-js' ), 
            '1.0.2', 
            true 
        );

        wp_register_style( 
            'another-map-interactive-css', 
            plugin_dir_url( dirname( __FILE__ ) ) . 'assets/css/style.css', 
            array(), 
            '1.0.2' 
        );
    }

    public function render_shortcode( $atts ) {
        wp_enqueue_script( 'another-map-interactive-js' );
        wp_enqueue_style( 'another-map-interactive-css' );

        $data_url = plugin_dir_url( dirname( __FILE__ ) ) . 'assets/data/world-110m.json';

        wp_localize_script( 
            'another-map-interactive-js', 
            'AnotherMapConfig', 
            array( 'dataUrl' => esc_url( $data_url ) ) 
        );

        return '<div id="another-map-interactive-container" class="another-map-container"></div>';
    }
}