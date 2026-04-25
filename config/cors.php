<?php

return [
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [],

    'allowed_origins_patterns' => [
        '#^https://([a-z0-9-]+\.)?kommo\.com$#i',
        '#^https://([a-z0-9-]+\.)?amocrm\.ru$#i',
        '#^https://([a-z0-9-]+\.)?amocrm\.com$#i',
        '#^http://localhost(:\d+)?$#i',
        '#^http://127\.0\.0\.1(:\d+)?$#i',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
