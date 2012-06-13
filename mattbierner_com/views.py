import simplejson as json

from collections import defaultdict

from django.views.generic.base import View, TemplateResponseMixin
from django.shortcuts import get_object_or_404
from django.http import Http404, HttpResponse

from haystack.query import SearchQuerySet

from taggit.models import Tag

from mattbierner_com.pages.models import Page


class SearchView(View):
    def get_search_results(self, query=None, *args, **kwargs):
        if query is None:
            return Page.objects.all()
        else:
            return [x.object for x in SearchQuerySet().filter(content=query)]
        
    def get_result_set(self, results):    
        # build a counted dict of tags
        tags = defaultdict(int)
        for page in results:
            for tag in page.tags.all():
                tags[tag] += 1

        return [x[0] for x in sorted(tags.items(), reverse=True, key=lambda x: x[1])]


class SearchDataView(SearchView, TemplateResponseMixin):
    template_name = 'search_results.json'

    def get(self, request, *args, **kwargs):
        return self.render_to_response(self.get_context_data(
            query=request.GET.get('query', None), **kwargs))
        
    def get_context_data(self, query=None, *args, **kwargs):
        pages = self.get_search_results(query=query)
        return {
            'tags': self.get_result_set(pages),
            'results': pages,
        }
        

class IndexView(SearchView, TemplateResponseMixin):
    template_name = 'index.html'
    
    def get(self, request, *args, **kwargs):
        return self.render_to_response(self.get_context_data(
            query=request.GET.get('query', None), **kwargs))
    
    def get_context_data(self, query=None, *args, **kwargs):
        pages = self.get_search_results(query=query)
        return {
            'tags': self.get_result_set(pages),
            'pages': pages,
        }
    