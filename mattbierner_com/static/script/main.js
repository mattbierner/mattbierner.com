$(function()
{    
    var setupPage = function(p)
    {
        $('article').html(p['body']);
        $('#page_header h1').text(p['title']);
    };
    
    // Handle search
    $("#root_search from").bind("onsubmit", function(e)
    {
        
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