import simplejson as json

from django.core import serializers
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.views.generic.base import View, TemplateResponseMixin

from haystack.query import SearchQuerySet

from taggit.models import Tag

from mattbierner_com.views import IndexView
from mattbierner_com.pages.models import Page


class PageDataView(View, TemplateResponseMixin):
    template_name = 'page.json'
        
    def get(self, request, *args, **kwargs):
        return self.render_to_response(self.get_context_data(
            url=request.GET['url'], **kwargs))
    
    def get_context_data(self, url=None, *args, **kwargs):
        return {
            'self': get_object_or_404(Page, url=url)
        }


class PageView(IndexView, TemplateResponseMixin):
    template_name = 'page_view.html'
    
    def get_context_data(self, url=None, *args, **kwargs):
        url = '/' + url
        ctx = super(PageView, self).get_context_data(*args, **kwargs)
        ctx.update({
            'page' : get_object_or_404(Page, url=url)
        })
        return ctx
        
