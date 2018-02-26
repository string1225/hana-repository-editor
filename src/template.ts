'use strict';

export const template = {
    '.xsapp': {},

    '.xsaccess': {
        "exposed": true,               // Expose data via http
        "authentication":
            {
                "method": "Form"
            },
        "authorization":                // Privileges for application access
            [
                "sap.xse.test::Execute",
                "sap.xse.test::Admin"
            ],
        "rewrite_rules":               // URL rewriting rules
            [{
                "source": "/entries/(\\d+)/(\\d+)/(\\d+)/",
                "target": "/logic/entries.xsjs?year=$1&month=$2&day=$3"
            }],
        "mime_mapping":                // Map file-suffix to MIME type
            [{
                "extension": "jpg", "mimetype": "image/jpeg"
            }],
        "force_ssl": true,             // Accept only HTTPS requests
        "enable_etags": true,          // Allow generation of etags
        "prevent_xsrf": true,          // Prevent cross-site request forgery
        "anonymous_connection": "sap.hana.sqlcon::AnonConn",  //.xssqlcc object
        "default_connection": "sap.hana.sqlcon::sqlcc",  //.xssqlcc object
        "cors":                        // Permit cross-origin browser requests
            {
                "enabled": false
            },
        "default_file": "homepage.html", // Override default access setting
        "cache_control": "no-cache, no-store", // Manage static Web-content cache
        "headers":                   // Enable X-Frame-Options HTTP header field
            {
                "enabled": true,
                "customHeaders":
                    [{
                        "name": "X-Frame-Options", "value": "SAMEORIGIN"
                    }]
            }
    },

    '.xsprivileges': {
        "privileges":
            [
                { "name": "Execute", "description": "Basic execution privilege" },
                { "name": "Admin", "description": "Administration privilege" }
            ]
    }
};