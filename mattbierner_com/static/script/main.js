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
            // why you no fire the transitionend for nested transitions webkit?
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
    var createSideTag = function(obj)
    {
        return $('<li class="SideTag">\
            <a class="Tag" href="?query=${name}">${name}</a>\
        </li>'.mapFormat(obj)).data('tagId', obj.id).data('tagName', obj.name);
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
            <p class="ResultBrief">${brief}</p>\
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
    
    var search = function(query)
    {
        var uri = encodeURIComponent(query);
        $("#root_search form input").val(query);
        $.getJSON('/search?query=' + uri, function(p)
        {
            if (!p)
                return;
            history.pushState(p, "Search: " + query, '?query=' + uri);
            onSearchResultChange(p['results'], p['tags']);
        });
        
    }
    
// init
    $(".SearchResult").each(function(i)
    {        
        var tags = $(this).data('tags');
        if (tags)
            $(this).data('tags', JSON.parse(tags));
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
   
    
    // Handle search
    $("#root_search form").submit(function(e)
    {
        e.preventDefault(); // cancel default submit action        
        var query = $(this).find('input').val();
        search(query);
    });
    
    $(".SideTag > .Tag").live('click', function(e)
    {
        e.preventDefault(); // cancel default link action
        var tag = $(this).parent('.SideTag');
        tag.addClass("ActiveTag"); 
        search(tag.data('tagName'));
    });
    
    // Handle mouseenter and mouseleave on SearchResult
    $(".SearchResult").live('mouseenter', function(e)
    {
        var tags = $(this).data('tags');
        if (!tags)
            return;
            
        var toRemove = {};
        $(".SideTag").each(function(i)
        {
            var id = $(this).data('tagId');
            if (tags.indexOf(id) >= 0)
                $(this).addClass("ActiveTag");
            else
                toRemove[id] = $(this);
        });
        
        $.each(toRemove, function(i)
        {
            var c = this.clone().css('opacity', '0.0').appendTo('#tags');
            fadeCollapseRemoveAnimate(this);
            c.css('opacity', '1.0')
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
    
    
    // Handle back navigation
    window.onpopstate = function(e)
    {
        var state = e.state || results;
        if (state)
            onSearchResultChange(state['results'], state['tags']);     
    };
});