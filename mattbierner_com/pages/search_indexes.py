import datetime

from haystack import indexes

from mattbierner_com.pages.models import Page


class PageIndex(indexes.SearchIndex, indexes.Indexable):
    text = indexes.CharField(document=True, use_template=True)
    created = indexes.DateField(model_attr='created')
    tags = indexes.MultiValueField() 

    class Meta:
        model = Page

    def prepare_tags(self, obj): 
        return [tag.name for tag in obj.tags.all()] 

    def get_model(self):
        return Page

    def index_queryset(self):
        """Used when the entire index for model is updated."""
        return self.get_model().objects.filter(updated__lte=datetime.datetime.now())