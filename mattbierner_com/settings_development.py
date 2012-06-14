DEBUG = True
TEMPLATE_DEBUG = DEBUG

from settings_base import *


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'OPTIONS': {
            'read_default_file': '/Users/mattbierner/config/mysql/mattbierner_com_devel.cnf',
        },
    }
}

HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine',
        'URL': 'http://127.0.0.1:9200/',
        'INDEX_NAME': 'haystack',
    },
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

SECRET_KEY = 't7-a5^olkfh=aunlcz3p3nwphn$#rnr&u())9y)))zsvm6r+p2'
