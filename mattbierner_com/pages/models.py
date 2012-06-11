import simplejson as json

from django.db import models
from django.core.urlresolvers import reverse
from django.utils.http import urlquote

from markupfield.fields import MarkupField

from taggit_autocomplete_modified.managers import TaggableManager


class Page(models.Model):
    title = models.CharField(unique_for_year='created', max_length=128)
    url = models.CharField(unique=True, max_length=128)
    created = models.DateField(auto_now_add=True, editable=False)
    updated = models.DateField(auto_now=True, editable=False)

    brief = models.CharField(max_length=140)
    header = MarkupField(blank=True, default_markup_type='textile')
    body = MarkupField(blank=True, default_markup_type='textile')

    tags = TaggableManager()

    class Meta:
        verbose_name_plural = "Pages"
        verbose_name = "Page"
        ordering = ['-created']
        get_latest_by = 'created'

    def __unicode__(self):
        return u'%s' % (self.title)

    def get_absolute_url(self):
        return u'%s' % urlquote(self.url)
    