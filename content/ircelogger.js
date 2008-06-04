// $Id$

window.addEventListener('load',  onWindowLoad, true);


var str;
var isNewFile;
var outputMode;


function appendLogFile (aFile, aDataStream, charset, header, footer) {
	if (aFile.exists()) {
     var inputStream = Components.classes["@mozilla.org/network/file-input-stream;1"].
	 createInstance(Components.interfaces.nsIFileInputStream);

     var scriptableStream = Components.classes['@mozilla.org/scriptableinputstream;1']
	 .createInstance(Components.interfaces.nsIScriptableInputStream);

     inputStream.init(aFile, MODE_RDONLY, 0, false);
     scriptableStream.init(inputStream);

     str = scriptableStream.read(-1);
     inputStream.close();
     scriptableStream.close();


     isNewFile = 0;
     outputMode = MODE_WRONLY;
   }
   else {
       isNewFile = 1;
       outputMode = MODE_RDWR | MODE_CREATE | MODE_APPEND;
   }



   var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
       createInstance(Components.interfaces.nsIFileOutputStream);
   outputStream.init(aFile, outputMode, 0664, 0);


   
   if(charset)
       aDataStream = convertFromUnicode( charset, aDataStream );


   if (isNewFile) {

       // check if dir exists...
       // nsIFile.exists()  or .isDirectory()
       // .create(nsIFile.DIRECTORY_TYPE, perm...)


       outputStream.write(header, header.length);
       outputStream.write(aDataStream, aDataStream.length);
       outputStream.write(footer, footer.length);
   }
   else {


       if (sloggerGetVar("logfileAppend")) {
	   // append at end

	   var bodyLen = str.lastIndexOf(footer);

	   if (bodyLen == -1) 
	       bodyLen = str.length;
	   outputStream.write(str, bodyLen);
	   outputStream.write(aDataStream, aDataStream.length);
	   outputStream.write(footer, footer.length);
       }
       else {
	   // append at beginning

	   outputStream.write(header, header.length); // write header
	   outputStream.write(aDataStream, aDataStream.length);	 // write new
	   var nohead = str.substring(header.length);
	   outputStream.write(nohead, nohead.length); // remove header from str and add
       }

   }
   
   outputStream.close();

}

function writeStyleFile(aFile) {

//    var aFile = Components.classes["@mozilla.org/file/local;1"]
//        .createInstance(Components.interfaces.nsILocalFile);
//    aFile.initWithPath(aFilePath);

   var str;
   
   if (!aFile.exists()) {
       
       var outputMode = MODE_RDWR | MODE_CREATE | MODE_APPEND;
       
       var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
	   createInstance(Components.interfaces.nsIFileOutputStream);
       outputStream.init(aFile, outputMode, 0664, 0);
       
       var str = replaceVars(sloggerGetVar("styleContent"));
       
       outputStream.write(str, str.length);
       outputStream.close();
       

   }
   
   
}


// convert aSrc into aCharset from Unicode for file i/o
function convertFromUnicode( aCharset, aSrc ) {
    // http://lxr.mozilla.org/mozilla/source/intl/uconv/idl/nsIScriptableUConv.idl
    var unicodeConverter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    unicodeConverter.charset = aCharset;
    return unicodeConverter.ConvertFromUnicode( aSrc );
}
// convert aSrc into Unicode for file i/o
function convertToUnicode( aSrc ) {
    var unicodeConverter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    return unicodeConverter.ConvertToUnicode( aSrc );
}



// just toggle state
function actionPushed(n) {
    var elmt = document.getElementById("slogger-button-push"+n);

    if (elmt.checked == true)
	elmt.checked = false;
    else
	elmt.checked = true;

}
function actionClicked(n) {
    // clicks 1,2,3 are actions 4,5,6: 
    n = n + 3;

    
    //    sloggerexecAction("execAction"+n);
    var proflist = new Array();
    proflist = proflist.concat(sloggerGetVar("execAction"+n).split("|"));
    sloggerExecProfiles(proflist);
}


// changed profile from popup menu:
//
//function clickedProfilePopup() {
    //var n = 0;
    //while(!document.getElementById("slogger-popup-profile").childNodes[n].getAttribute("checked"))
    //n++;
    //sloggerSetVar("curr_profile",n);
//    msg('clicked');
//}


function onWindowLoad() {

    var proflist = new Array();

    proflist = proflist.concat(sloggerGetVar("execAction0").split("|"));

    var bp1 = document.getElementById("slogger-button-push1");
    var bp2 = document.getElementById("slogger-button-push2");
    var bp3 = document.getElementById("slogger-button-push3");

    if (bp1) {
	if (bp1.checked)
	    proflist = proflist.concat(sloggerGetVar("execAction1").split("|"));
    }
    if (bp2) {
	if (bp2.checked)
	    proflist = proflist.concat(sloggerGetVar("execAction2").split("|"));
    }
    if (bp3) {
	if (bp3.checked)
	    proflist = proflist.concat(sloggerGetVar("execAction3").split("|"));
    }

    //    msg('px ' + proflist.length);
    sloggerExecProfiles(proflist);

//     if (document.getElementById("slogger-button-push1").checked)
// 	sloggerexecAction("execAction1");
//     if (document.getElementById("slogger-button-push2").checked)
// 	sloggerexecAction("execAction2");
//     if (document.getElementById("slogger-button-push3").checked)
// 	sloggerexecAction("execAction3");

}




function sloggerPopupCmd(aEvent)
{
    var id = aEvent.target.getAttribute("id");

    if (id == "slogger-popup-gotoDirOLD") {

    }
    else if (id == "slogger-popup-TESTING1") {
    }
    else if (id == "slogger-popup-settings") {
	window.openDialog("chrome://slogger/content/sloggerSettings.xul");
    }
    else if (id == "slogger-popup-help") {
	sloggerOpenTab('chrome://slogger/content/sloggerdoc.html');
    }
    else if (id.substring(0,11) == "custom_menu") {

	sloggerOpenTab(document.getElementById(id).value);
    }

    else if (id.substring(0,11) == 'profileList') {
	// run single profile...
	var pref_filename = document.getElementById(id).value;

	var proflist = new Array(pref_filename);
	//proflist.push(pref_filename);

	sloggerExecProfiles(proflist);

    }
    else if (id.substring(0,15) == 'profileEditList') {
	// run single profile...
	var pref_filename = document.getElementById(id).value;
	//msg('---------- edit profile. skiping ' + pref_filename);
	editProfile(pref_filename);
    }
    else {
	msg('unknown popup command: ' + id);
    }

}



function sloggerBuildMenu() {

	var Ppopup1 = document.getElementById("slogger-popup-profile");
	var Ppopup2 = document.getElementById("slogger-popup-edit-profile");

	// first clear out the popupmenu:
	while (Ppopup1.hasChildNodes()) 
	  Ppopup1.removeChild(Ppopup1.childNodes[0]);
	while (Ppopup2.hasChildNodes()) 
	  Ppopup2.removeChild(Ppopup2.childNodes[0]);

	var profiles = getProfileFilelist();

	msg("------------------------------------ " + profiles.length);
	for (var i=0; i<profiles.length; i++) {
	    msg("i="+i+", "+profiles[i]);
	    msg(getPrefFromFile(profiles[i],'profName'));

	  var newMenuItem1 = document.createElement('menuitem');
	  newMenuItem1.id = "profileList" + i;
          newMenuItem1.setAttribute('label',getPrefFromFile(profiles[i],'profName'));
          newMenuItem1.setAttribute('value',profiles[i]);
	  Ppopup1.appendChild(newMenuItem1);

	  var newMenuItem2 = document.createElement('menuitem');
	  newMenuItem2.id = "profileEditList" + i;
          newMenuItem2.setAttribute('label',getPrefFromFile(profiles[i],'profName'));
          newMenuItem2.setAttribute('value',profiles[i]);
	  Ppopup2.appendChild(newMenuItem2);
	}
	msg("------------------------------------");




	// remove nodes before 'first_sep'...
	var tt0 = document.getElementById('slogger-popupmenu');
	while(tt0.childNodes[0].id != 'first_sep') {
	    tt0.removeChild(tt0.childNodes[0]);
	}

	//var tt1 = document.createElement('menuitem');
 	//tt1.setAttribute('label','xxx');
	var tt3 = document.getElementById('first_sep');
 	//tt0.insertBefore(tt1, tt3);

	// custom menu links ------------------------------------
	//var custom = document.getElementById("slogger-popup-custom-sub");
	//while (custom.hasChildNodes())
	//    custom.removeChild(custom.childNodes[0]);

	var customMenu = replaceVars(sloggerGetVar("customMenu"));
	var none=1;
	if (customMenu) {
	    var cmList = customMenu.split("|");
	    if (cmList.length > 0) {
		for (var i=0; i<cmList.length; i=i+2) {
		    var newMenuItem = document.createElement('menuitem');
		    newMenuItem.id = "custom_menu" + (i/2);
		    newMenuItem.setAttribute('label',cmList[i]);
		    newMenuItem.setAttribute('value',cmList[i+1]);
		    //'chrome://slogger/content/test.xul');
		    //custom.appendChild(newMenuItem);
		    tt0.insertBefore(newMenuItem, tt3);
		    none=0;
		}
	    }
	}
	if (none) {
	    var newMenuItem = document.createElement('menuitem');
	    newMenuItem.setAttribute('label','(None)');
	    newMenuItem.setAttribute('style','text-align:center;');
	    newMenuItem.setAttribute('disabled',true);
	    tt0.insertBefore(newMenuItem, tt3);
	}

}




// // run the series of profiles corresponding to 
// // an action.
// // e.g action=="clickA" (click button A)
// //
// function sloggerexecAction(action) {
// 	// -----------------------------------------------------------------------
// 	// 1. set vars in structure:
// 	//    logvar.filename
// 	//    logvar.size 
// 	//    ...
// 	// 2. cycle thru prof_exec list
// 	//    a. set ALL prof-specific vars
// 	//    b. run exec
// 	//
//     //    var prof_exec_list = sloggerGetVar("prof_exec_" + action).split(",");
//     msg('sloggerexecAction, ' + action);

//     var prof_exec      = sloggerGetVar(action);
//     //msg(prof_exec);
//     //msg(prof_exec.split("|"));
//     var prof_exec_list = prof_exec.split("|");
//     //    msg(prof_exec_list.length);

//     for (var i=0; i<prof_exec_list.length; i++) {
// 	var pref_filename = prof_exec_list[i];
// 	if (pref_filename != "") {


// 	    //msg('about to run profile ' + pref_filename);
// 	    sloggerExecProfile(pref_filename);

// 	    // loadpreffile
// 	    // get doc, t, setVars()
// 	    // filters
// 	    // ...

// 	}
//     }
    
// 	// -----------------------------------------------------------------------
// }



// this is used as _one_ place to 
//   call sloggerExecProfile multiple times
//   lastURL, lastTime, etc checked once for 
//   this group of profiles...
// this function is called ONCE from either:
//   - a button click
//   - a page load
//
function sloggerExecProfiles(proflist) {

    //    msg('pp ' + proflist.length);

    var numran = 0;
    var doc = window._content.document;
    var t = setVars(doc);
    var tdiff = t.getTime() - Date.parse(sloggerGetVar("lastTime"));

    for (var i=0; i<proflist.length; i++) {
	var profcurr = proflist[i];
	if (profcurr != "") {

	    // load file here?...
	    numran += sloggerExecProfile(profcurr,doc,tdiff);

	}
    }


    // set lastURL lastTime
    if (numran>0) {
	// lastURL vs url... i think okay...
	//  - these two are like a delay...
	sloggerSetVar("lastTime",t,"lastURL",sloggerGetVar("url"));
	//    sloggerSetVar("mostRecentFolder",sloggerGetVar("destFolder"));
    }


}



// Execute a single Profile:
function sloggerExecProfile(pref_filename,doc,tdiff)
{
    //msg('execprof');
    //    msg('sloggerExecProfile, ' + pref_filename);

    // load prefs... (What about prefs that aren't set in some file?)
    //                !!! they should be set to defaults, not 
    //                    kept as prev value... (or not?)
    loadPrefFile(pref_filename,0);
    
    
    //msg("TT: " + sloggerGetVar("logfileEnable"));

    
    // SET VARS ----------------------------------------------
    //  ----------------------------------------------
    //  ----------------------------------------------
    // returns t, we need it...

    //var doc = window._content.document;

    //var t = setVars(doc);

    
    // FILTERS ----------------------------------------------
    //  ----------------------------------------------
    //  ----------------------------------------------

    // blacklist:
    if (sloggerGetVar("enableBlacklist")) {
	var BL = sloggerGetVar("blacklist").split(" ||| ");
	for (var i=0; i<BL.length; i++) {
	    //msg('checking blacklist rule: ' + BL[i]);
	    var chk = replaceVars(BL[i]);
	    //msg('check: ' + chk);
	    if (eval(chk)) {
		//msg('Blacklist Match!!');
		return 0;
	    }
	    else {
		//msg('no match.');
	    }
	}
    }
    
    // whitelist:
    if (sloggerGetVar("enableWhitelist")) {
	var WL = sloggerGetVar("whitelist").split(" ||| ");
	if (WL.length > 0) {
	    var passed = 0;

	    for (var i=0; i<WL.length; i++) {
		//msg('checking whitelist rule: ' + WL[i]);
		var chk = replaceVars(WL[i]);
		//msg('check: ' + chk);
		if (eval(chk)) {
		    //if (eval(WL[i])) {
		    //msg('whitelist okay');
		    passed=1;
		}
		else {
		    //msg('whitelist match! exit...');
		    //return 0;
		}
		//}
	    }

	    if (passed==0)
		return 0;
	}
    }
    

    // The one special filter:
    // FILTER repeated page:
    if (sloggerGetVar("enableRepeatDelay")) {
	if (sloggerGetVar("lastURL")==sloggerGetVar("url")) {
	    if (sloggerGetVar("lastTime") != "") {
		//var diff = t.getTime() - Date.parse(sloggerGetVar("lastTime"));
		if (tdiff < (sloggerGetVar("repeatDelay")*1000)) {
		    msg('skipping log due to repeat URL under delay');
		    return 0;
		}
	    }
	}
    }


    // reset some vars:
    sloggerSetVar("keywords","");
    sloggerSetVar("desc","");



    if (sloggerGetVar("confirmEnable")) {
	
// 	var str = '';
// 	var conList = sloggerGetVar('confirmString').split("|");
// 	if (conList.length > 0) {
// 	    for (var i=0; i<conList.length; i++) {
// 		str = str + conList[i] + "\n";
// 	    }
// 	}


	var confirmObj = new Object(); 

	window.openDialog("chrome://slogger/content/sloggerConfirm.xul","_blank",
				  "modal,dialog,centerscreen,chrome",confirmObj);

	if (!confirmObj.returnOK)
	    return 0;

	//window.openDialog("chrome://slogger/content/sloggerConfirm.xul","_blank",
	// 			      "modal,dialog,centerscreen,chrome", confirmObj, 
	// 			      sloggerGetVar("logfileEnable"),
	// 			      sloggerGetVar("savepageEnable"));
	
	// 	    if (confirmObj.cancel==1)
	// 		return;
	
	// 	    localfile = confirmObj.localfile;
	// 	    logfileName = confirmObj.logfileName;
	// 	    logfileContent = confirmObj.logfileContent;
	// 	    pref_appendnewline = confirmObj.appendnewline;
	
	// 	    // the only time this actually changes a preference is for "confirm" checkbox
	// 	    sloggerSetVar("confirm", confirmObj.confirm);
	//}


//         var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
// 	    .getService(Components.interfaces.nsIPromptService);
// 	str = "Confirm variables:\n" + str;
// 	var val = promptService.confirm(window, "Submit log?", str);
// 	if (!val)
// 	    return;


    }



    if (sloggerGetVar("customScriptEnable")) {
	if (sloggerGetVar("customScriptStart") == false) {
	    var customScript = replaceVars(sloggerGetVar("customScript"));
	    if (customScript.length > 0) {
		try {
		    eval(customScript);
		}
		catch (e) { alert('Error running your custom script \n Check the javascrip console'); }
	    }
	}
    }



    // !!!!!
    //var localfile = replaceVars(sloggerGetVar("localfileFormat"));
    //sloggerSetVar("localfile",localfile);
    //msg('pagefilename: ' + localfile);
    var localfile = replaceVars(sloggerGetVar("localfile"));




    //-- moved savepage stuff before logfile, so that
    //   lastSavedFile* vars are set correctly for 
    //   use in the logfile
    //   (they're set in savePage() function)


    // savepage -----------------------------------------
    // --------------------------------------------------
    // --------------------------------------------------
    if (sloggerGetVar("savepageEnable")) {
	//msg('about to do savepage...');

	var localfileDirStr = replaceVars(sloggerGetVar("localfileDir"));
	//msg('localfileDirStr = ' + localfileDirStr);

	if (sloggerGetVar("flipDirSlash")) {
	    localfileDirStr = localfileDirStr.replace(/\//g,'\\');
	}

	var localfileDir = Components.classes["@mozilla.org/file/local;1"]
	    .createInstance(Components.interfaces.nsILocalFile);

	localfileDir.initWithPath(localfileDirStr);

	// create data directory if need to:
	//msg('about to check dir');
	if (!localfileDir.exists()) {
	    //msg('creating dir');
	    localfileDir.create(0x01,0755);
	}

	var localfile = replaceVars(sloggerGetVar("localfile"));

	savePage(
		 doc,
		 localfileDir,
		 localfile,
		 sloggerGetVar("dlmanager"),
		 sloggerGetVar("savepageType")
		 );
    }
    




    if (sloggerGetVar("logfileEnable")) {

	var savetypeStr;
	if (sloggerGetVar("savepageEnable")) {
	    savetypeStr = sloggerGetVar("savepageType") + 1;
	    savetypeStr = savetypeStr+'';
	}
	else
	    savetypeStr = '0';

	var exml = sloggerGetVar("escapeXML");
	var logfileContent = replaceVars(sloggerGetVar("logfileContent"), exml); 
	var logfileHeader  = replaceVars(sloggerGetVar("logfileHeader"), exml);
	var logfileFooter  = replaceVars(sloggerGetVar("logfileFooter"), exml);
	
	var logfileName = replaceVars(sloggerGetVar("logfileName"));
    }
    


    
    
    // logfile ------------------------------------------
    // --------------------------------------------------
    // --------------------------------------------------
    if (sloggerGetVar("logfileEnable")) {

	var logfileDirStr = replaceVars(sloggerGetVar("logfileDir"));
	if (sloggerGetVar("flipDirSlash"))
	    logfileDirStr = logfileDirStr.replace(/\//g,'\\');
	var logfileDir = Components.classes["@mozilla.org/file/local;1"]
	    .createInstance(Components.interfaces.nsILocalFile);
	logfileDir.initWithPath(logfileDirStr);

	// create dir if need to:
	if (!logfileDir.exists())
	    logfileDir.create(0x01,0755);

	var logfile = logfileDir.clone();
	logfile.append(replaceVars(sloggerGetVar("logfileName")));


	appendLogFile(
		      logfile,
		      logfileContent,
		      "UTF-8",
		      logfileHeader,
		      logfileFooter
		      );

	
	sloggerSetVar("lastLogFile",logfileName);


	if (sloggerGetVar("styleEnable")) {
	    var stylefile = logfileDir.clone();
	    stylefile.append(replaceVars(sloggerGetVar("styleName")));
	    writeStyleFile(stylefile);
	}
	
	if (sloggerGetVar("add_logfile_menuitem")) {
	    var label = sloggerGetVar("text_logfile_menuitem");

	    var ds = '/';
	    if (sloggerGetVar("flipDirSlash"))
		ds = '\\';
	    var lfp = sloggerGetVar("logfileDir") + ds +  sloggerGetVar("logfileName");
	    sloggerAddMenu(label,"file://"+lfp);
	}
    }
    


    
    
    // services....





    if (sloggerGetVar("customScriptEnable")) {
	if (sloggerGetVar("customScriptStart") == true) {
	    var customScript = replaceVars(sloggerGetVar("customScript"));
	    if (customScript.length > 0) {
		try {
		    eval(customScript);
		}
		catch (e) { alert('Error running your custom script \n Check the javascrip console'); }
	    }
	}
    }



    return 1
}






//
// currently overwrites if file exists
//
function savePage(doc, localfileDir, localfileStr,
		 dlmanager, savepageType) {

    var localfile = localfileDir.clone();

    msg(localfileStr);
    // this try/catch hopefully finds cases where 
    //  filename contains "/"
    try {
	localfile.append(localfileStr);
    }
    catch (e) {
	msg("caught error in savePage().  localfileStr="+localfileStr);
	//var escaped = localfileStr.replace(/\//g, '\\\/'); 
	var escaped = localfileStr.replace(/\//g, '_'); 
	msg("escaped="+localfileStr);
	try {
	    localfile.append(escaped);
	}
	catch (e) {
	    alert("Slogger: error saving file " + escaped);
	    return;
	}
    }

    var persist = makeWebBrowserPersist();

    var contentType = null;
    if      (savepageType==1) contentType = "text/html";
    else if (savepageType==2) contentType = "text/plain";


    // persist flags:
    const nsIWBP = Components.interfaces.nsIWebBrowserPersist;
    var persist_flags = 0;

//     persist_flags |=  nsIWBP.PERSIST_FLAGS_NONE;
     persist_flags |=  nsIWBP.PERSIST_FLAGS_FROM_CACHE;
//     persist_flags |=  nsIWBP.PERSIST_FLAGS_BYPASS_CACHE;
//     persist_flags |=  nsIWBP.PERSIST_FLAGS_IGNORE_REDIRECTED_DATA;
//     persist_flags |=  nsIWBP.PERSIST_FLAGS_IGNORE_IFRAMES;
//     persist_flags |=  nsIWBP.PERSIST_FLAGS_NO_CONVERSION;
     persist_flags |=  nsIWBP.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
//     persist_flags |=  nsIWBP.PERSIST_FLAGS_NO_BASE_TAG_MODIFICATIONS;
//     persist_flags |=  nsIWBP.PERSIST_FLAGS_FIXUP_ORIGINAL_DOM;
//     persist_flags |=  nsIWBP.PERSIST_FLAGS_FIXUP_LINKS_TO_DESTINATION;
//     persist_flags |=  nsIWBP.PERSIST_FLAGS_DONT_FIXUP_LINKS;
//     persist_flags |=  nsIWBP.PERSIST_FLAGS_SERIALIZE_OUTPUT;
//     persist_flags |=  nsIWBP.PERSIST_FLAGS_DONT_CHANGE_FILENAMES;
//     persist_flags |=  nsIWBP.PERSIST_FLAGS_FAIL_ON_BROKEN_LINKS;
//     persist_flags |=  nsIWBP.PERSIST_FLAGS_CLEANUP_ON_FAILURE;
     persist_flags |=  nsIWBP.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
    

     // encoding flags
     var encodingFlags = 0;
     // all flags:
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_SELECTION_ONLY;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_FORMATTED;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_RAW;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_BODY_ONLY;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_PREFORMATTED;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_WRAP;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_FORMAT_FLOWED;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_ABSOLUTE_LINKS;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_ENCODE_W3C_ENTITIES;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_CR_LINEBREAKS;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_LF_LINEBREAKS;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_NOSCRIPT_CONTENT;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_NOFRAMES_CONTENT;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_ENCODE_BASIC_ENTITIES;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_ENCODE_LATIN1_ENTITIES;
//      encodingFlags |= nsIWBP.ENCODE_FLAGS_ENCODE_HTML_ENTITIES;

     if (savepageType>0) {
	 encodingFlags |= nsIWBP.ENCODE_FLAGS_FORMATTED;
	 encodingFlags |= nsIWBP.ENCODE_FLAGS_ABSOLUTE_LINKS;
	 encodingFlags |= nsIWBP.ENCODE_FLAGS_NOFRAMES_CONTENT;
     }
     else {
	 encodingFlags |= nsIWBP.ENCODE_FLAGS_ENCODE_BASIC_ENTITIES;
     }


     // accompanying files folder  ----------------------
     var filesFolder = localfile.clone();
     
     var nameWithoutExtension = filesFolder.leafName.replace(/\.[^.]*$/, "");
     var filesFolderLeafName = getStringBundle().
	 formatStringFromName("filesFolder",[nameWithoutExtension],1);
     filesFolder.leafName = filesFolderLeafName;
     // ---------------------------------
     
     const kWrapColumn = 80;

     //     msg(doc);
     
     var firstArg;
     //if (savepageType==1)
     //	 firstArg = URI;
     //else
     firstArg = doc;

     if (savepageType==1) filesFolder = null;
     if (savepageType==2) filesFolder = null;
     
     persist.persistFlags = persist_flags;
     var pout = persist.saveDocument(
				     firstArg,
				     localfile,
				     filesFolder,
				     contentType,
				     encodingFlags,
				     kWrapColumn
				     );

     // maybe should check if sucessful...
     //msg("-----------------------------");
     //msg("lastSavedFile: " + localfile.path);
     //msg("lastSavedFileName: " + localfile.leafName);
     //msg("lastSavedFilePath: " + localfileDir.path);
     
     sloggerSetVar("lastSaveFile",localfile.path);
     sloggerSetVar("lastSaveFileName",localfile.leafName);
     sloggerSetVar("lastSaveFilePath",localfileDir.path);
}

// relevant:
///home/ken/firefox_src/firefox-1.5rc3/mozilla/toolkit/locales/en-US/chrome/global/contentAreaCommands.properties


// Web Page, complete
///home/ken/firefox_src/firefox-1.5rc3/mozilla/extensions/manticore/browser/browserwindow.cs:          dlg.Filter = "Web Page, complete (*.htm;*.html)|*.htm*|Web Page, HTML only (*.htm;*.html)|*.htm*|Text only (*.txt)|*.txt";
///home/ken/firefox_src/firefox-1.5rc3/mozilla/embedding/browser/activex/src/control/MozillaBrowser.cpp:    //TODO:    The IE control allows you to also save as "Web Page, complete"
///home/ken/firefox_src/firefox-1.5rc3/mozilla/toolkit/locales/en-US/chrome/global/contentAreaCommands.properties:WebPageCompleteFilter=Web Page, complete
///home/ken/firefox_src/firefox-1.5rc3/mozilla/browser/locales/en-US/chrome/browser/browser.properties:WebPageCompleteFilter=Web Page, complete




// set all $vars in prefs
// this is information about the current file, etc...
// (return time object t)
function setVars(aDocument) {
    //    var aDocument = window._content.document;
    
    var aURL;	
    if (aDocument)
	aURL = aDocument.location.href;
    else
	aURL = _content.location.href;
    
    var t = new Date();
    var d0 = t.getFullYear()+'';
    var d1 = t.getMonth()+1;  d1=d1+'';// getmonth is 0-indexed
    var d2 = t.getDate()+'';
    var d3 = t.getHours()+'';
    var d4 = t.getMinutes()+'';
    var d5 = t.getSeconds()+'';
    var d6 = t.getMilliseconds()+'';
    if (d1.length<2) d1='0'+d1;
    if (d2.length<2) d2='0'+d2;
    if (d3.length<2) d3='0'+d3;
    if (d4.length<2) d4='0'+d4;
    if (d5.length<2) d5='0'+d5;
    if (d6.length<3) d6='0'+d6;
    if (d6.length<3) d6='0'+d6;
    
    // some code here is from getDefaultFileName() in contentAreaUtils.js)
    // tempURI used in place of aSniffer.uri
    //var tempURI = makeURL(aURL);
    var tempURI = makeURI(aURL);
    
    // *** 2) Use the actual file name, if present
    var filename = '';
    try {
	var url = tempURI.QueryInterface(Components.interfaces.nsIURL);
	if (url.fileName != "") {
	    filename = validateFileName(decodeURIComponent(url.fileName));
	}
    } catch (e) {
	try {
	    // the file name might be non ASCII
	    // try unescape again with a characterSet
	    var textToSubURI = Components.classes["@mozilla.org/intl/texttosuburi;1"]
		.getService(Components.interfaces.nsITextToSubURI);
	    var charset = getCharsetforSave(aDocument);
	    filename = validateFileName(textToSubURI.unEscapeURIForUI(charset, url.fileName));
	} catch (e) {
	    // This is something like a wyciwyg:, data:, and so forth
	    // URI... no usable filename here.
	}
    }
    // *** 3) Use the document title
    var title = aDocument.title;
    // may want a title.replace(/^\s+|\s+$/g, "") to remove leading/trailing spaces
    // title.toString() ??

    // *** 5) Use the host.
    var host;
    try {
	if (tempURI.host)
	    host = tempURI.host;
    } catch (e) {
	// Some files have no information at all, like Javascript generated pages
    }

    // hostinv:
    var hostinv = "";
    try {
	var hostarray = host.split(".");
	for (var i=hostarray.length-1; i>=0; i--) {
	    hostinv = hostinv + hostarray[i];
	    if (i != 0)
		hostinv = hostinv + ".";
	}
    }
    catch (e) { }


    //msg('about to set var prefs...');
    //msg('  filename: ' + filename);

    // content-type (or MIME type);
    var type = aDocument.contentType;

    var fileext = '';
    var filebase = '';

    if (filename.indexOf(".") > -1) {
	fileext = filename.match(/\..*$/)[0].substr(1);
	var endIdx = filename.length - fileext.length - 1;
	filebase = filename.substring(0, endIdx);
    }


    // for now, typeext=filext unless type=="text/html", then make
    //    sure, it's set to html
    // 
    var typeext;
    if (type.toLowerCase() == "text/html")
    	typeext = "html";
    else
    	typeext = fileext;

    // DOMWindow = getBrowser().contentWindow;
    // doc = DOMWindow.document
    // URI = doc.location.href
    // title = doc.title.toString()
    // timestamp = new Date()
    // image = this.contextImage

    var clip = "";
    try {
	clip = getBrowser().contentWindow.getSelection().toString();
    }
    catch (e) { }

    //var clip = window._content.getSelection().toString();
    // if DOMWindow==null, clip=''
    // clip = DOMWindow.getSelection().toString();

    //!!!!!
//     // store vars as prefs: .var.*
// removed savetype for now...
// 		    "htmlfile","",
    //		    "datadir","",

    sloggerSetVar(
		  "url",aURL,
		  "filename",filename,
		  "title", convertToUnicode( title ),
		  "host",host,
		  "hostinv",hostinv,

		  "type",type,
		  "typeext",typeext,

		  "clip",clip,

		  "fileext",fileext,
		  "filebase",filebase,

		  "datetime", t.toString(),
		  "year",d0,
		  "month",d1,
		  "day",d2,
		  "hour",d3,
		  "minute",d4,
		  "second",d5,
		  "millisecond",d6
		  );
    
    return t;
}

