from django.conf.urls.defaults import *
from django.conf import settings
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from mattbierner_com.views import IndexView, SearchDataView
from mattbierner_com.pages import urls as PageUrls  

admin.autodiscover()

urlpatterns = patterns('',
    #
    url(r'^taggit_autocomplete_modified/', include('taggit_autocomplete_modified.urls')),

    # Django Admin
    (r'^admin/', include(admin.site.urls)),
    
    # Search
    url(r'^search$', SearchDataView.as_view(), name='search'),
    
    # Index
    url(r'^$', IndexView.as_view(), name='index'),
)

urlpatterns += PageUrls.urlpatterns



if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve',
         {'document_root': settings.MEDIA_ROOT}),
    )
    
    urlpatterns += staticfiles_urlpatterns()

