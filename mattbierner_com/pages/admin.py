from django.contrib import admin

from mattbierner_com.pages.models import Page

    
class PageAdmin(admin.ModelAdmin):
    list_display = ('title', 'url', 'created')
    list_filter = ['created']
    
    fieldsets = [
        (None, {
            'fields': ['title', 'url', 'brief', 'tags']
        }),
        ('Content', {
            'fields': ['header', 'body']
        }),
    ]


admin.site.register(Page, PageAdmin)
