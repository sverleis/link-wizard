<?php
/**
 * Link Wizard Terminal Component
 * 
 * @package Link_Wizard_For_WooCommerce
 * @since 1.0.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Link Wizard Terminal Class
 */
class Link_Wizard_Terminal {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('admin_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_ajax_link_wizard_get_terminal_data', array($this, 'get_terminal_data'));
    }
    
    /**
     * Enqueue scripts and styles
     */
    public function enqueue_scripts($hook) {
        if ('toplevel_page_link-wizard-for-woocommerce' !== $hook) {
            return;
        }
        
        wp_enqueue_script(
            'link-wizard-terminal',
            plugin_dir_url(__FILE__) . '../admin/build/link-wizard-terminal.js',
            array('wp-element', 'wp-components'),
            '1.0.0',
            true
        );
        
        wp_enqueue_style(
            'link-wizard-terminal',
            plugin_dir_url(__FILE__) . '../admin/css/link-wizard-terminal.css',
            array(),
            '1.0.0'
        );
        
        wp_localize_script('link-wizard-terminal', 'linkWizardTerminal', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('link_wizard_terminal_nonce'),
            'siteUrl' => get_site_url(),
        ));
    }
    
    /**
     * Get terminal data via AJAX
     */
    public function get_terminal_data() {
        check_ajax_referer('link_wizard_terminal_nonce', 'nonce');
        
        $response = array(
            'success' => true,
            'data' => array(
                'timestamp' => current_time('mysql'),
                'status' => 'ready'
            )
        );
        
        wp_send_json($response);
    }
    
    /**
     * Check if terminal is enabled
     */
    public static function is_enabled() {
        // Can be easily disabled by returning false here
        // or by adding a filter: return apply_filters('link_wizard_terminal_enabled', true);
        return true;
    }
}

// Initialize the terminal component
new Link_Wizard_Terminal();
