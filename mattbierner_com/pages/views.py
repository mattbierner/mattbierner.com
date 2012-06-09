import simplejson as json

from django.core import serializers
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.views.generic.base import View, TemplateResponseMixin

from haystack.query import SearchQuerySet

from taggit.models import Tag

from mattbierner_com.views import SearchView
from mattbierner_com.pages.models import Page


class PageDataView(View):
    def get(self, request, *args, **kwargs):
        url = request.GET['url']
        response = HttpResponse(content_type='application/json')
        try:
            page = Page.objects.get(url=url)
            json.dump({
                'title': page.title,
                'tags': [tag.name for tag in page.tags.all()] ,
                'brief': page.brief,
                'header': page.header.rendered,
                'body': page.body.rendered,
            }, response)
            return response
        except Page.DoesNotExist:
            return Http404


class PageView(SearchView, TemplateResponseMixin):
    template_name = 'page.html'
    
    def get(self, request, *args, **kwargs):
        return self.render_to_response(self.get_context_data(**kwargs))
    
    def get_context_data(self, url=None, *args, **kwargs):
        url = '/' + url
        ctx = super(PageView, self).get_context_data(*args, **kwargs)
        ctx.update({
            'page' : get_object_or_404(Page, url=url)
        })
        return ctx
        
