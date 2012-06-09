from collections import defaultdict

from django.views.generic.base import View, TemplateResponseMixin
from django.shortcuts import get_object_or_404
from django.http import Http404

from haystack.query import SearchQuerySet

from taggit.models import Tag

from mattbierner_com.pages.models import Page


class SearchView(View, TemplateResponseMixin):
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

class IndexView(SearchView):
    template_name = 'index.html'
