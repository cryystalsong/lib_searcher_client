let results = null;
let results_done = false;
let api_url = "https://libsearcherapi.herokuapp.com";

const searchLibrary = () => {
    $("#card-group")[0].innerHTML= "";
    search_query = $("#search-input")[0].value;
    search_query = search_query.replace(/ /g, "+");

    libraries = []

    for (var i = 0; i < $(":checked")["length"]; i++) {
        library = $(":checked")[i].value;
        libraries.push(library);
    }

    library_logo_src = {
        "VPL": "./assets/vpl.png",
        "NWPL": "./assets/nwpl.jpg",
        "RPL": "./assets/rpl.png",
        "BPL": "./assets/bpl.jpg"
    }

    libraries.forEach(library => {
        var lib_logo = library_logo_src[library];

        $.ajax({
            url: `${api_url}/search/?library=${library}&search_keywords=${search_query}`,
            success: function (result) {
                console.log(result);

                result["results"].forEach(content => {
                    var template = document.getElementById('template').innerHTML;
                    content["lib_logo"] = lib_logo;

                    var rendered = Mustache.render(template, content);
                    $("#card-group").append(rendered);                      
                });

            }
        });
    });
}