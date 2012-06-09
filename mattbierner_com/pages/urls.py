from django.conf.urls.defaults import *

from mattbierner_com.pages.views import PageView, PageDataView

urlpatterns = patterns('mattbierner_com.pages.views',
    url(r'^page$',
        PageDataView.as_view(),
    ),
                       
    url(r'^(?P<url>.+)$',
        PageView.as_view(),
        name='Page-ViewPage'
    ),
)
