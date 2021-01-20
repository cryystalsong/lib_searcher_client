let results = null;
let results_done = false;
let api_url = "https://libsearcherapi.herokuapp.com";

const generateBibliocommonsDomain = (library) => {
    let bibliocommons_domains = {
        "VPL": "vpl",
        "NWPL": "newwestminster",
        "RPL": "yourlibrary",
        "BPL": "burnaby"
    }
    return `https://${bibliocommons_domains[library]}.bibliocommons.com`;
}

const retrieveSelectedLibraries = () => {
    libraries = []
    
    for (var i = 0; i < $(":checked")["length"]; i++) {
        library = $(":checked")[i].value;
        libraries.push(library);
    }

    return libraries
}

const createContentCards = (results, library) => {
    let library_logo_src = {
        "VPL": "./assets/vpl.png",
        "NWPL": "./assets/nwpl.jpg",
        "RPL": "./assets/rpl.png",
        "BPL": "./assets/bpl.jpg"
    }

    let lib_logo = library_logo_src[library];
    let lib_domain = generateBibliocommonsDomain(library)

    results.forEach(content => {
        var template = document.getElementById('template').innerHTML;
        content["lib_logo"] = lib_logo;
        content["book_link"] = lib_domain + content["book_link"];

        var rendered = Mustache.render(template, content);
        $(`#${library}`).append(rendered);                 
    });
}
const seeMore = (library, currentPage, totalPages) => {
    // TODO: implement see more results

    console.log(library, currentPage, totalPages);
}

const searchLibrary = () => {
    $("#card-group")[0].innerHTML= "";    
    $("#loading").show();

    libraries = retrieveSelectedLibraries();
    
    search_query = $("#search-input")[0].value;
    search_query = search_query.replace(/ /g, "+");
    
    libraries.forEach((library, index) => {
        let search_url = `${api_url}/search/?library=${library}&search_keywords=${search_query}`;

        $.ajax({
            url: search_url,
            success: function (result) {
                console.log(result);

                let total_result_count = result["total_result_count"]
                let current_result_count = result["current_result_count"]
                let library = result["library"]

                if (total_result_count <= 0) {
                    $("#card-group")
                        .append($("<h3>")
                        .text(
                            `${total_result_count} total results from ${library}`
                            )
                        );
                } else {
                    $("#card-group")
                        .append($("<h3>")
                        .text(
                            `Showing ${current_result_count} of ${total_result_count} total results from ${library}`
                            )
                        );
                    
    
                    $("#card-group").append(
                        `<div class="${library}_cards" id="${library}"></div>`
                    );
    
                    createContentCards(result["results"], library);
                    
                    currentPage = result["currentPage"]
                    totalPages = result["totalPages"]

                    if (currentPage != totalPages) {
                        $("#card-group").append(
                            `<button type="button" 
                                class="btn btn-primary" 
                                id="${library}-see-more" 
                                onclick="seeMore(library, currentPage, totalPages)">
                                    See More from ${library}
                                </button>`
                        );
                    } 
                    
                    // when results from all libraries are shown 
                    if (index === libraries.length - 1) {
                        $("#loading").hide();
                    }
                }
            }
        });
    });
}