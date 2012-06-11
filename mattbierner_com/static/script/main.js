$(function()
{
    $(".SideTag").each(function(i)
    {
        $(this).data('value', $.trim($(this).text()));
    });
    
    $(".SearchResult").each(function(i)
    {
        var tags = [];
        $(this).find('.Tag').each(function(i)
        {
            tags.push($.trim($(this).text()));
        });
        $(this).data({
            tags: tags
        });
    });

    
    var setupPage = function(p)
    {
        if (p)
        {
            $('article').html(p['body']);
            $('#page_header h1').text(p['title']);
        }
        else
        {
            $('article').html("");
            $('#page_header h1').text("");
        }
    };
    
    // Handle search
    $("#root_search form").submit(function(e)
    {
        e.preventDefault(); // cancel default submit action
        
        var query = $(this).find('input').val();
        $.getJSON('/search?query=' + encodeURI(query), function(p)
        {
                
        });
    });
    
    // Handle mouseenter and mouseleave on SearchResult
    $(".SearchResult").mouseenter(function(e)
    {
        var tags = $(this).data()['tags'] || [];
        $(".SideTag").each(function(i)
        {
            if (tags.indexOf($(this).data('value')) >= 0)
                $(this).addClass("ActiveTag");   
        });
    }).mouseleave(function(e)
    {
        $(".SideTag").each(function(i)
        {
            $(this).removeClass("ActiveTag");   
        });
    });
    
    
    // Handle mouseenter and mouseleave on SideTags
    $(".SideTag").mouseenter(function(e)
    {
        $(this).addClass("ActiveTag");   

        var value = $(this).data('value');
        $(".SearchResult").each(function(i)
        {
            var tags = $(this).data()['tags'];
            if (tags && tags.indexOf(value) < 0)
                $(this).addClass("NonActiveSearchResult");   
        });
    }).mouseleave(function(e)
    {
        $(this).removeClass("ActiveTag");   

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
                page: p
            }, p['title'],  dest);
            
            // setup new page
            setupPage(p);    
        });
    });
    
    
    // Handle back navigation
    window.onpopstate = function(e)
    {
        var state = e.state;
        if (state)
            setupPage(state['page']);
        else
            setupPage(root_page);
        
    };
});