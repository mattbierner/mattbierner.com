import simplejson as json

from collections import defaultdict

from django.views.generic.base import View, TemplateResponseMixin
from django.shortcuts import get_object_or_404
from django.http import Http404

from haystack.query import SearchQuerySet

from taggit.models import Tag

from mattbierner_com.pages.models import Page


class SearchView(View):
    def get_search_results(self, query=None, *args, **kwargs):
        if query is None:
            return Page.objects.all()
        else:
            return [x.object for x in SearchQuerySet().filter(content=query)]
        
    
class SearchDataView(SearchView):
    def get(self, request, *args, **kwargs):
        query = request.GET['query']
        response = HttpResponse(content_type='application/json')
        json.dump([get_search_results(query=query)], response)
        return response
        

class IndexView(SearchView, TemplateResponseMixin):
    template_name = 'index.html'
    
    def get(self, request, *args, **kwargs):
        return self.render_to_response(self.get_context_data(
            query=request.GET.get('query', None), **kwargs))
    
    def get_context_data(self, query=None, *args, **kwargs):
        pages = []
        if query is None:
            pages = Page.objects.all()
        else:
            pages = [x.object for x in SearchQuerySet().filter(content=query)]
        
        # build a counted dict of tags
        tags = defaultdict(int)
        for page in pages:
            for tag in page.tags.all():
                tags[tag] += 1

        return {
            'tags': [x[0] for x in sorted(tags.items(), reverse=True, key=lambda x: x[1])],
            'pages': pages,
        }
    