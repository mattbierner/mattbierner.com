$(function()
{
    var page = undefined;
    
    // Setup
    $("#search_results .SearchResultHeader a").live("click", function(e)
    {
        e.preventDefault(); // cancel default link action
        
        // If already at url, noop 
        var dest = $(this).attr('href');
        if (window.location.pathname == dest)
            return;
        
        // Push the state.
        var title = $(this).text();

        history.pushState({
            page: page
        }, title,  dest);
        
        // Set new page title.
        $('.PageHeader h1').text(title);
        
        // request new page content
        $.getJSON('/page?url=' + encodeURI(dest), function(page)
        {
            if (!page)
                return;
            
            $('.PageBody').html(page['body']);
        });
    });
    
});