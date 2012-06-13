(function(){

/**
 * Formats a string given a map object. Looks for tokens of type ${...}. Tokens
 * are used as paths if they contains any '.' characters.
 */
String.prototype.mapFormat = (function(){
    var re = /\$\{(\w+)\}/g;
    var sep = '.';
    return function(map)
    {
        return this.replace(re, function(capture)
        {
            var val = capture.slice(2, capture.length - 1) || "";
            return val.split(sep).reduce(function(p, c){ return p[c]; }, map);
        });
    }
}());

}());


$(function()
{
// General functions
    var identity = function(e){ return e; }
    
    /**
     * Convert an array to a map.
     * 
     * @param k Function that maps elems to keys.
     * @param [v] Function that maps elems to values. 
     */
    var mapArray = function(arr, k, v)
    {
        var v = v || identity;
        return arr.reduce(function(p, c){ p[k(c)] = v(c); return p; }, {});
    }
    
// Animation

    var fadeCollapseRemoveAnimate = function(elem)
    {
        var transitionEndEvents = 'transitionend webkitTransitionEnd'; 
        elem.on(transitionEndEvents, function(e)
        {
            elem.css({
                'transition': "max-height 0.2s",
                '-moz-transition': "max-height 0.2s",
                '-webkit-transition': "max-height 0.2s",
                'max-height': 0
            });
            // why you no fire the transitionend for transitions nested webkit?
            setTimeout(function(){ elem.remove(); }, 200); 
        }).css({
            'max-height': elem.height(),
            'transition': "opacity 0.15s",
            '-moz-transition': "opacity 0.15s",
            '-webkit-transition': "opacity 0.15s",
            'opacity': '0'
        });
    }
   
   
// page specific
    var page_css_link = $('<link id="page_style_sheet" rel="stylesheet" href="${link}" />'.mapFormat({
        'link': page_style_sheet
    }));
    
    var createSideTag = function(obj)
    {
        return $('<li class="SideTag">\
            <a class="Tag" href="/?query=${name}">${name}</a>\
        </li>'.mapFormat(obj)).data('tagId', obj.id);
    }
    
    var createSearchResult = function(obj)
    {
        var tags = obj.tags.map(function(e)
        {
            return $('<li class="Tag">${name}</li>'.mapFormat(e));
        });
        
        var result = $('<li class="SearchResult" \
            data-page-id="${id}"> \
            <h2 class="SearchResultHeader">\
                <a href="${absolute_url}">${title}</a>\
            </h2>\
            <div>\
                <ul class="TagList"></ul>\
                <p class="ResultBrief">${brief}</p>\
            </div>\
        </li>'.mapFormat(obj));
        var tagList = result.find('.TagList');
        tagList.append.apply(tagList, tags);

        var tagIds = obj.tags.map(function(e){ return e.id; });
        return result.data('tags', tagIds);
    }
    
    var addSearchResult = function(obj)
    {
        obj.css('opacity', 0);
        $('#search_results').append(obj);
        obj.css({
            'opacity': 1,
            'transition': "opacity 0.2s",
            '-moz-transition': "opacity 0.2s",
            '-webkit-transition': "opacity 0.2s"
        });
    }
    
    $(".SearchResult").each(function(i)
    {        
        $(this).data('tags', JSON.parse($(this).data('tags')));
    });

    var onSearchResultChange = function(results, tags)
    {
        var resultMap = mapArray(results, function(e){ return e.id; });
        var tagMap = mapArray(tags, function(e){ return e.id; });
        
        // Remove existing tags
        $('#tags').children('li.SideTag').each(function(i)
        {
            var id = $(this).data('tagId');
            if (id != undefined && tagMap[id] != undefined)
                tagMap[id] = undefined;
            else
                fadeCollapseRemoveAnimate($(this));
        });

        // Add new tags
        $.each(tagMap, function(k, v)
        {
            if (v)
            {
                var tag = createSideTag(v).css({
                    'opacity': 0
                });
                $('#tags').append(tag);
                tag.css({
                    'opacity': 1,
                    'transition': "opacity 0.2s",
                    '-moz-transition': "opacity 0.2s",
                    '-webkit-transition': "opacity 0.2s"
                });
            }
        });
        
        // Remove existing results
        $('#search_results').children('li.SearchResult').each(function(i)
        {
            var id = $(this).data('pageId');
            if (id != undefined && resultMap[id] != undefined)
                resultMap[id] = undefined;
            else
                fadeCollapseRemoveAnimate($(this));
        });
        
         // Add new results
        $.each(resultMap, function(k, v)
        {
            if (v)
                addSearchResult(createSearchResult(v));
        });
        
        if (results.length == 0)
        {
            addSearchResult($('<li class="SearchResult EmptyResult">No results found</li>'));
        }
    };
    
    var setupPage = function(p)
    {
        $('#page_header h1').text(p ? p['title'] : "");
        $('article .PageHeader').html(p ? p['header'] : "");
        $('article .PageBody').html(p ? p['body'] : "");
    };
    
    // Handle search
    $("#root_search form").submit(function(e)
    {
        e.preventDefault(); // cancel default submit action
        
        var query = $(this).find('input').val();
        $.getJSON('/search?query=' + encodeURIComponent(query), function(p)
        {
            if (!p)
                return;
            onSearchResultChange(p['results'], p['tags'])       
        });
    });
    
    // Handle mouseenter and mouseleave on SearchResult
    $(".SearchResult").live('mouseenter', function(e)
    {
        var tags = $(this).data('tags');
        if (!tags)
            return;

        $(".SideTag").each(function(i)
        {
            if (tags.indexOf($(this).data('tagId')) >= 0)
                $(this).addClass("ActiveTag");   
        });
    }).live('mouseleave', function(e)
    {
        $(".SideTag").each(function(i)
        {
            $(this).removeClass("ActiveTag");   
        });
    });
    
    
    // Handle mouseenter and mouseleave on SideTags
    $(".SideTag > .Tag").live('mouseenter', function(e)
    {
        var tag = $(this).parent('.SideTag');
        tag.addClass("ActiveTag");   

        var value = tag.data('tagId');
        $(".SearchResult").each(function(e)
        {
            var tags = $(this).data()['tags'];
            if (tags && tags.indexOf(value) < 0)
                $(this).addClass("NonActiveSearchResult");   
        });
    }).live('mouseleave', function(e)
    {
        $(this).parent('.SideTag').removeClass("ActiveTag");   
        $(".SearchResult").each(function(i)
        {
            $(this).removeClass("NonActiveSearchResult");   
        });
    });
    
    // Handle clicks on SearchResult
    $("#search_results .SearchResultHeader a").live("click", function(e)
    {
        e.preventDefault(); // cancel default link action
        
        // if already at url, noop 
        var dest = $(this).attr('href');
        if (window.location.pathname == dest)
            return;
            
        // set new page title.
        var title = $(this).text();
        $('#page_header h1').text(title);

        // Request new page content
        $.getJSON('/page?url=' + encodeURI(dest), function(p)
        {
            if (!p)
                return;
                
            // push the state.
            history.pushState({
                page: p,
                results: $.extend(true, [], state['results'])
            }, p['title'],  dest);
            
            if ($('head #page_style_sheet').length == 0)
                $('head').append(page_css_link);
            
            // setup new page
            setupPage(p);    
        });
    });
    
    
    // Handle back navigation
    window.onpopstate = function(e)
    {
        if (e.state)
            setupPage(e.state['page']);
        else
        {
            setupPage(state['page']);
            $('head #page_style_sheet').remove();
        }
        
    };
});