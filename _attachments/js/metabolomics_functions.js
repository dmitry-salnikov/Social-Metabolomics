if(window.location.hostname == 'abe-bhaleraolab.age.uiuc.edu') {
	$.couch.urlPrefix = 'http://abe-bhaleraolab.age.uiuc.edu/couchdb';
	}
$db = $.couch.db("metabolomics");
dbget_uri = 'http://www.genome.jp/dbget-bin/www_bget?'
var pathwayList = [];
kopattern = /(map|ko)\d{5}/ig;
path_num = /\d{5}/i;

compound_show_uri = 'compound/';
pathway_show_uri = 'pathway/';

function makeButtons() {
    
    $("div#metabolites").empty();
        
    $db.view("metabolomics/known_keggIDs", {
        success: function(data) {
            $("div#metabolites").append('<table>');
            for (i in data.rows) {  
                doc_id = data.rows[i].id;  
                name = data.rows[i].key;  
                keggID = data.rows[i].value.KeggID;  
                html = '<div><tr>' +  
                '<td><input class="check" type="checkbox" id="' + doc_id + '">&nbsp;&nbsp;' + 
                '<a title="Add your insights" href="#">' + name + '</a></input></td> '+  
                //'<td>' + name + '</td> ' +  
                //'<td>' + keggID + '</td> ' +  
                //'<td><a href="#" class="edit" id="' + doc_id + '">edit</a></td> '+  
                '</tr></div>';  
                $("div#metabolites").append(html);
            }
            $("div#metabolites").append("</table>");
        }});
}

function addUpdateForm(target, existingDoc) {  
    html = '<form name="update" id="update" action=""> <table>' +  
    //'<tr><td>Name:</td><td>' + (existingDoc ? existingDoc.Name : "") + '</td></tr>' +  
    '<tr><td>KeggID:</td><td>' + (existingDoc ? existingDoc.KeggID : "") + '</td></tr>' +  
    '<tr><td>In Pathways:</td><td>'+ (existingDoc ? existingDoc.Pathways : 'unknown') + '</td></tr>' +  
    '<tr><td>HMDB Accession Number:</td><td> <input type="text" name="hmdb_id" id="hmdb_id"/ value="' +  
    (existingDoc ? existingDoc.HMDB_id : "") + '"></td></tr>' + 
    '<tr><td>Notes:</td><td> <textarea rows="4" cols="40" name="Notes" id="Notes">' + 
    (existingDoc ? existingDoc.Notes : "") + '</textarea></td></tr>' +
    '<tr><td><input type="submit" name="submit" class="update" value="' +
    (existingDoc?"Update":"Add") + '"/></td><td>' +   
    '<input type="submit" name="cancel" class="cancel" value="Cancel"/></td></tr>' +   
    '<tr><td><a href="' + compound_show_uri + existingDoc._id + '">Add your own insight</a>' + '</td><td></td></tr>' +
    '</table></form>';  
    target.append(html);  
    target.children("form#update").data("existingDoc", existingDoc);  
}  

function updatePathways(doc, state, cb) {
    pathstring = doc.Pathways;
    pathways = pathstring.match(kopattern);	 
    if(state == true) { //add to table
        for(path in pathways) {
            if(pathwayList[pathways[path]] == undefined) {
                pathwayList[pathways[path]] = 1;
            }
            else {
                num = pathwayList[pathways[path]];
                num = num+1;
                pathwayList[pathways[path]] = num;
            }
        }
    }
    else { // remove from table
        for(path in pathways) {
            num = pathwayList[pathways[path]];
            num = num -1;
            pathwayList[pathways[path]] = num;
        }
    }
    
    $("div#pathways").empty();
    $('div#dynatext').empty();
    $('div#wordcloud').empty();
    $("div#pathways").append('<table id="tab"><tr><th>KO/MAP</th><th>Count</th><th>Name</th><th>Class</th></tr>');
    for(path in pathwayList) {
        path_key = path.match(path_num);
        times = pathwayList[path];
        if(times > 0) {
            uri = '_view/pathways?key="';
            uri = uri + path_key + '"';
            $.getJSON(uri, function(data) {
                
                obj = data.rows;
                path_name = obj[0]["key"];
                row = obj[0].value;
                if(row.Description != "") {
                    $("div#dynatext").append('<p><a href=' + pathway_show_uri + obj[0]["id"] + '>' + row.Prefix+path_name +  '</a>: ' + row.Description + '</p>');
                }
                $("table#tab").append('<tr><td>' + 
                    '<a href=' + pathway_show_uri + obj[0]["id"] + '>' + row.Prefix+path_name +  '</a></td>' +
                    '<td align="center">' + pathwayList[row.Prefix+path_name] + "</td><td>" +
                    row.Name + "</td><td>" + "  " + row.Class + 
                    '</td></tr>');
                $("#dynatext").dynaCloud('#wordcloud');
                });
            }
        }
}

$(document).ready(function() {
    makeButtons();
    $("button#add_new").click(function(event) {     
				$("form#update").remove();  
				$("button#add").hide();  
				addUpdateForm($("div#add_new"));  
			});
    
    $("div#metabolites").click(function(event) {
        $tgt = $(event.target);
        if($tgt.attr("type") == "checkbox") {
            id = $tgt.attr("id");
            state = $tgt.attr("checked");
            $db.openDoc(id, { success: function(doc) {  
            updatePathways(doc, state); 
            }});
        }
        if ($tgt.hasClass("edit")) { 
            id = $tgt.attr("id");
            $("button#add").show();  
            $("form#update").remove();  
            $db.openDoc(id, { success: function(doc) {  
            addUpdateForm($tgt.parent(), doc);  
            }});  
        }	
    });
    
    $("input.cancel").live('click', function(event) {  
    			$("button#add").show();  
   				$("form#update").remove();  
    			return false;  
  		 	});   
  		 	
    $("input.update").live('click', function(event) {  
            var $tgt = $(event.target);  
            var $form = $tgt.parents("form#update");  
            var $doc = $form.data('existingDoc') || {};   
            $doc.HMDB_id = $.trim($form.find("input#hmdb_id").val());
            $doc.Notes = $.trim($form.find("textarea#Notes").val());
            $db.saveDoc(  
                $doc,  
                {success: function() {  
                $("button#add").show();  
                $("form#update").remove();  
                makeButtons();  
                }});  
            return false;  
           });  
    
    // add stopwords to $.stopWords
    app_stopwords = {
		'aa' : true, 
		'aas' : true,
		'md' : true, 
		'atp' : true, 
		'pathway' : true,
		'cycle' : true
		};
	$.extend($.wordStats.stopWords, app_stopwords);
		
	$('input[value="Login"]').live('click', function(e) {
		$.couch.login({
			name : $('input#username').val(),
			password : $('input#password').val(),
			success: function(data) {
				location.reload();
				},
			error: function(data) {
				alert("unable to log in");
				}
		});

	});
		
	$('a#logout').live('click', function(e) {
		 
		 $.couch.logout({
			success: function(data) {
				location.reload();
				},
			error: function(data) {
				console.log(data);
				}
			});
	
	});
	
	$("a#login").click(function(e) {
		$('form#loginform').remove();
		
		html = '<form id="loginform">' + 	
		'<p><label for="name">Username</label><br />' +
		'<input id="username" name="username" value="" type="text" tabindex="1" /></p>'+
		'<p><label for="password">Password</label><br />' +
		'<input id="password" name="password" value="" type="password" tabindex="2" />' +
		'<p class="no-border">' +
		'<input class="button" value="Login" tabindex="3" />' +
		'</form>';	
		
		$(e.target).parent().append(html);
	});
	
});	    