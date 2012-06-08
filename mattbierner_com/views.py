from django.views.generic.base import View, TemplateResponseMixin
from django.shortcuts import get_object_or_404
from django.http import Http404

from taggit.models import Tag

from mattbierner_com.pages.models import Page


class IndexView(View, TemplateResponseMixin):
    template_name = 'index.html'
    
    def get(self, request, *args, **kwargs):
        return self.render_to_response(self.get_context_data(
            query=request.GET.get('query', None), **kwargs))
    
    def get_context_data(self, query=None, *args, **kwargs):
        pages = []
        if query is None:
            pages = Page.objects.all()
        else:
            pages = None
        
        return {
            'tags': Tag.objects.all(),
            'pages': pages,
        }
