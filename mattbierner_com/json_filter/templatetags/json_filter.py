import simplejson as json

from django import template

from django.utils.safestring import mark_safe


register = template.Library()


@register.filter(name='as_json', needs_autoescape=False)
def as_json(value):
    return mark_safe(json.dumps(value))
