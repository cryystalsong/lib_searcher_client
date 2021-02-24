let results = null;
let results_done = false;
let api_url = "https://libsearcherapi.herokuapp.com";

let libraryCounts = {}

const generateBibliocommonsDomain = (library) => {
    let bibliocommons_domains = {
        "VPL": "vpl",
        "NWPL": "newwestminster",
        "RPL": "yourlibrary",
        "BPL": "burnaby",
        "surreyLibraries": "surrey",
        "NVDPL": "nvdpl",
        "FVRL": "fvrl",
        "PMPL": "portmoody"
    }
    return `https://${bibliocommons_domains[library]}.bibliocommons.com`;
}

const retrieveSelectedLibraries = () => {
    libraries = []
    
    for (var i = 0; i < $(":checked")["length"]; i++) {
        if ($(":checked")[i].className == "form-check-input") {
            library = $(":checked")[i].value;
            libraries.push(library);
        }
    }

    Cookies.set("libraries", libraries);
    return libraries
}

const createContentCards = (results, library) => {
    let library_logo_src = {
        "VPL": "./assets/vpl.png",
        "NWPL": "./assets/nwpl.jpg",
        "RPL": "./assets/rpl.png",
        "BPL": "./assets/bpl.jpg",
        "surreyLibraries": "./assets/spl.jpg",
        "NVDPL": "./assets/nvdpl.png",
        "FVRL": "./assets/fvrl.jpg",
        "PMPL": "./assets/pmpl.png",
    }

    let lib_logo = library_logo_src[library];
    let lib_domain = generateBibliocommonsDomain(library)

    results.forEach(content => {
        var template = document.getElementById('template').innerHTML;
        content["lib_logo"] = lib_logo;
        content["book_link"] = lib_domain + content["book_link"];
        book_title = content["title"].replace(/ /g, "+");
        content["amzn_link"] = `https://www.amazon.ca/s?k=${book_title}&linkCode=w13&tag=libsearcher-20`;
        
        if (content["availability"].includes("Available")) {
            content["bg_style"] = "text-success";   
        } else if (content["availability"] == "All copies in use") {
            content["bg_style"] = "text-danger";
        }

        var rendered = Mustache.render(template, content);
        $(`#${library}-cards`).append(rendered);                 
    });
}

const generateSearchAPI = (library, page=null) => {    
    let search_query = $("#search-input")[0].value;
    search_query = search_query.replace(/ /g, "+");

    if (page) {
        return `${api_url}/search/?library=${library}&search_keywords=${search_query}&page=${page}`;
    }
    return `${api_url}/search/?library=${library}&search_keywords=${search_query}`;
}

const seeMore = (library) => {
    let current_result_count = libraryCounts[library]["current_result_count"]  
    let total_result_count = libraryCounts[library]["total_result_count"]  

    if (current_result_count < total_result_count) {
        $(`#${library}-loading`).show();

        current_page = libraryCounts[library]["current_page"] + 1;
        let search_url = generateSearchAPI(library, current_page);
        
        libraryCounts[library]["current_page"] = current_page;
    
        $.ajax({
            url: search_url,
            success: function (result) {
                $(`#${library}-loading`).hide();
    
                paginationResultCount = result["current_result_count"]
                libraryCounts[library]["current_result_count"]  += paginationResultCount
                
                createContentCards(result["results"], library);
                $(`#${library}-result-count-text`).text(
                    `Showing ${libraryCounts[library]["current_result_count"]} of ${total_result_count} total results from ${library}`
                )

                if (libraryCounts[library]["current_result_count"] == total_result_count) {
                    $(`#${library}-see-more`).hide();
                }
            }
        });    
    }
}

const resetPage = () => {
    $("#card-group")[0].innerHTML= "";    
    $("#library-checkboxes-alert").hide();
    $("#search-alert").hide();
}

const searchLibrary = () => {
    
    let libraries = retrieveSelectedLibraries();   
    
    if (libraries.length == 0) {
        $("#library-checkboxes-alert").show();
        return
    }
    
    let search_query = $("#search-input")[0].value;
    
    if (search_query == "") {
        $("#search-alert").show();
        return
    }
    
    resetPage();

    $("#loading").show();

    libraries.forEach((library, index) => {
        let search_url = generateSearchAPI(library);

        $.ajax({
            url: search_url,
            success: function (result) {
                console.log(result);

                let total_result_count = result["total_result_count"]
                let current_result_count = result["current_result_count"]
                let library = result["library"]

                if (total_result_count <= 0) {
                    $("#card-group")
                        .append($(`<h3 id=${library}-result-count-text class="library-result-count-text">`)
                        .text(
                            `${total_result_count} total results from ${library}`
                            )
                        );
                } else {
                    $("#card-group")
                        .append($(`<h3 id=${library}-result-count-text class="library-result-count-text">`)
                        .text(
                            `Showing ${current_result_count} of ${total_result_count} total results from ${library}`
                            )
                        );
                    
                    $("#card-group").append(
                        `<div class="library-cards" id="${library}-cards"></div>`
                    );
    
                    createContentCards(result["results"], library);
                    
                    let current_page = result["current_page"]
                    
                    libraryCounts[library] = {}

                    libraryCounts[library]["current_page"] = current_page
                    libraryCounts[library]["current_result_count"] = current_result_count
                    libraryCounts[library]["total_result_count"] = total_result_count

                    if (current_result_count != total_result_count) {
                        $("#card-group").append(
                            `<div class="text-center" id="${library}-loading" style="display: none">
                                <strong>Fetching more results from ${library}...</strong>
                                <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                                </div>
                            </div>`
                        );

                        $("#card-group").append(
                            `<button type="button" 
                                class="btn btn-primary" 
                                id="${library}-see-more" 
                                value="${library}"
                                onclick="seeMore(this.value)">
                                    See More from ${library}
                                </button>`
                        );
                    } 
                    
                }
                
                // when results from all libraries are shown 
                if (index === libraries.length - 1) {
                    $("#loading").hide();
                }
            },
            error: function () {                
                $("#loading").hide();
                $("#card-group")
                        .append($(`<h3 class="error-msg">`)
                        .text(
                            `Currently having some server trouble.. please check back later :( sorry`
                            )
                        );
            }
        });
    });
}

const getCookies = () => {
    cached_libraries = Cookies.get("libraries");
    cached_libraries = JSON.parse(cached_libraries);
    cached_libraries.forEach((lib)=>{
        if ($(`#${lib}`).length) {
            $(`#${lib}`)[0].checked = true;
        }
    });
}

$(document).ready(()=>{
    getCookies();
});