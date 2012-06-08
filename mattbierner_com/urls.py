from django.conf.urls.defaults import *
from django.conf import settings
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from mattbierner_com.views import IndexView

admin.autodiscover()

urlpatterns = patterns('',
    # Example:
    # (r'^{{ project_name }}/', include('{{ project_name }}.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    #
    url(r'^taggit_autocomplete_modified/', include('taggit_autocomplete_modified.urls')),

    # Django Admin
    (r'^admin/', include(admin.site.urls)),
    
    # Search
    url(r'^$', IndexView.as_view(), name='index'),

    # Pages
    (r'^(?P<url>.*)$', include('mattbierner_com.pages.urls')),
)


if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve',
         {'document_root': settings.MEDIA_ROOT}),
    )
    
    urlpatterns += staticfiles_urlpatterns()

