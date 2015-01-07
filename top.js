$(document).keydown(function(e) {
//	var code = (e.keyCode ? e.keyCode : e.which);
//	if(code == 8 || code == 116){
//		return false;
//	}
});

var iOAP = {
			sections : new Array(),
			secDetails : new Array(),
			languages : new Array(),
			viewLang : new Array(),
			modules : ["instructionsDiv","profileDiv","QPDiv","questionCont","sectionSummaryDiv"],
			mcQName : '', // mcq questions name
			msQName : '', // msq questions name
			saQName : '', // SA questions name
			compQName : '', // comp questions name
			laQName : '', // LA questions name
			subjQName:'', // subjective questions name
			showMarks : false,
			showQType : true,
			curSection : 1,
			curQues : 1,
			defaultLang: getCookie(),
			secWiseTimer: 0,
			noOptSec : 0,
			maxNoOptSec : '',
			time: 1800 ,
			minSubmitTime : 99
};



function getCookie(){
	var i,x,y,ARRcookies=document.cookie.split(";");
	for (i=0;i<ARRcookies.length;i++){
		x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
		y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
		x=x.replace(/^\s+|\s+$/g,"");
		if (x=="defaultLang"){
			return unescape(y);
		}
	}
}



function questions(quesText,quesID,quesType,options,answer,isParent,allottedMarks,negMarks,keyboardType){
	this.quesText = quesText;
	this.quesID = quesID;
	this.answer = answer;
	this.options = options;
	this.quesType = quesType;
	this.isParent=isParent;
	this.allottedMarks = allottedMarks;
	this.negMarks = negMarks;
	this.keyboardType = keyboardType;
}


function secBean(secName,answered,notanswered,marked,isOptional){
	this.secName = secName;
	this.answered = answered;
	this.notanswered = notanswered;
	this.marked = marked;
	this.isOptional = isOptional;
	this.isSelected = false;
}

function quesParams(langID,status){
	this.langID = langID;
	this.status = status;
}

function readXML(){
	var secCounter,quesCounter = 1,langCounter;
	$.ajax({
		type: "POST",
		url: "quiz.xml",
		dataType: ($.browser.msie) ? "text" : "xml",
		success: function(data) {
			var xml;
			if (typeof data == "string") {
				xml = new ActiveXObject("Microsoft.XMLDOM");
				xml.async = false;
				xml.loadXML(data);
			} else {
			   xml = data;
			}
			if(iOAP.secWiseTimer==0){
				iOAP.minSubmitTime= iOAP.time-iOAP.time*iOAP.minSubmitTime/100;
			}
			iOAP.maxNoOptSec = $(xml).find("MAXNOOPTSEC").text();
			var isShowMarks = $(xml).find("SHOWMARKS").text();
			//var isShowQType = $(xml).find("SHOWQTYPE").text();
			/*if(isShowMarks=="N"){
				iOAP.showMarks = false;
			}else if(isShowMarks=="Y"){
				iOAP.showMarks = true;
			}
			if(isShowQType=="N"){
				iOAP.showQType = false;
			}else if(isShowQType=="Y"){
				iOAP.showQType = true;
			}*/
			iOAP.showMarks = (isShowMarks.toUpperCase()=="YES")?true:false;
			
			//iOAP.showQType = (isShowQType=="N")?false:true;

			iOAP.mcQName = $.trim($(xml).find("mcQName").text());
			iOAP.msQName = $.trim($(xml).find("msQName").text());
			iOAP.compQName = $.trim($(xml).find("compQName").text());
			iOAP.laQName = $.trim($(xml).find("laQName").text());
			iOAP.saQName = $.trim($(xml).find("saQName").text());
			iOAP.subjQName = $.trim($(xml).find("subjQName").text());

			$(xml).find("SECTION").each(function(){
				secCounter = $(this).find("secID").text();
				langCounter = $(this).find("LANGID").text();
				quesCounter = 1;

				if(iOAP.secDetails[secCounter] == null){
					var secName = $(this).find("secName").text();
					var answered = 0;
					var notanswered = 0;
					var marked = 0;
					var isOptional = $(this).attr("ISOPTIONAL");
					if(isOptional == 'Y'){
						iOAP.noOptSec++;
					}
					iOAP.secDetails[secCounter] = new secBean(secName,answered,notanswered,marked,isOptional);
				}

				if(iOAP.languages[langCounter] == null){
					iOAP.languages[langCounter] = $(this).find("LANGNAME").text();
				}

				if(iOAP.sections[secCounter] == null){
					iOAP.sections[secCounter] = new Array();
				}

				if(iOAP.sections[secCounter][langCounter] == null){
					iOAP.sections[secCounter][langCounter] = new Array();
				}
				if(iOAP.viewLang[secCounter] == null){
					iOAP.viewLang[secCounter] = new Array();
				}
				$(this).find("QUESTION").each(function()
				{
					var quesText = $(this).find("NAME").text();
					var quesType = $(this).attr("TYPE");
					var options = new Array();;
					if(quesType != "SA" || quesType != "SUBJECTIVE" || quesType != "COMPREHENSION@@SA"){
						var optCounter = 0;
						$(this).find("ANSWER").each(function(){
							options[optCounter] = $(this).text();
							optCounter++;
						});
					}
					if(iOAP.viewLang[secCounter][quesCounter] == null){
						iOAP.viewLang[secCounter][quesCounter] = new quesParams(iOAP.defaultLang,'notAttempted');
					}
					var isParent = false;
					var keyboardType = 0;
					if(quesType.indexOf("LA")>-1 ||quesType.indexOf("COMPREHENSION")>-1){
						if($(this).attr("ISPARENT")=="Y")
							isParent = true;
					}
					if(quesType.indexOf("SA")>-1){
						keyboardType = $(this).find("KEYBOARDTYPE").text();
					}
					var allottedMarks = $(this).find("ALLOTTEDMARKS").text();
					var negMarks = $(this).find("NEGATIVEMARKS").text();

					var question = new questions(quesText,quesCounter,quesType,options,'',isParent,allottedMarks,negMarks,keyboardType);
					iOAP.sections[secCounter][langCounter][quesCounter] = question;
					quesCounter++;
				});
			});
			numPanelSec();
			getQuestion();
			fillSections();
			fillNumberPanel();
			if(iOAP.noOptSec>0){
				$('#showOptionalSecSummary').show();
				$('#noOptSec').html(iOAP.noOptSec);
				$('#maxOptSec').html(iOAP.maxNoOptSec);
			}
			
			if(iOAP.secDetails.length>6 && !$.browser.msie ){
				$('#questionCont').css({"height":"68%"});
				$('#instructionsDiv').css({"height":"68%"});
				$('#profileDiv').css({"height":"68%"});
				$('#QPDiv').css({"height":"68%"});
				$('#sectionSummaryDiv').css({"height":"68%"});
			}
			$("#pWait").hide();
		}
			
	});
	$('#viewQPButton').removeAttr("disabled"); // View QP button is getting disabled after refresh because of numpad_keyboard.js. Wierd behaviour
	$('#viewProButton').removeAttr("disabled");// View Profile button is getting disabled after refresh because of numpad_keyboard.js. Wierd behaviour
	$('#viewInstructionsButton').removeAttr("disabled");
	$("#basInst option[value='instEnglish']").attr("selected", "selected");
	

}



function getQuestion(){
	var ques = iOAP.viewLang[iOAP.curSection][iOAP.curQues];
	if(ques.status == "notAttempted"){
		iOAP.viewLang[iOAP.curSection][iOAP.curQues].status = "notanswered";
		iOAP.secDetails[iOAP.curSection].notanswered++;
	}
	fillSections();
	$('#currentQues').html(quesContent(iOAP.sections[iOAP.curSection][iOAP.viewLang[iOAP.curSection][iOAP.curQues].langID][iOAP.curQues]));
	var question = iOAP.sections[iOAP.curSection][iOAP.viewLang[iOAP.curSection][iOAP.curQues].langID][iOAP.curQues];
	if(question.quesType == "SA" || question.quesType == "LA@@SA" || question.quesType == "COMPREHENSION@@SA"){
		triggerKeyboard(question.keyboardType);
	}
	if(iOAP.curQues>19){
		var el = document.getElementById(iOAP.curQues);
		el.scrollIntoView(true);
	}
	enableOptButtons();
}

function isScrolledIntoView(elem)
{
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}


function bindCharCode(){
$('input').bind('keydown',function(event){
	var code = (event.keyCode ? event.keyCode : event.which); 
	if(code == 8){
		$(this).val($(this).val().substring(0,$(this).val().length -1));
	}else if(!((code > 44 && code < 58) || (code > 64 && code < 91) || (code>94 && code<123) || code==43 || code == 16 || code == 32)){
		return false;
	}
});
}

function applyKeyboard(){
	var div = document.getElementById('currentQues');
	var input = div.getElementsByTagName('input');
	if (input.length) {
		VKI_attach(input[0]);
	}
}

function fillMCQQues (quesTxt,quesOpts,answer){
	var str = "<div style='width:98%;margin-left:5px;font-family:Arial,verdana,helvetica,sans-serif;padding-bottom:10px'> "+quesTxt+ "</div><div style='width:100%;font-family:Arial,verdana,helvetica,sans-serif;margin-top:5px'><table>";
	var answers = answer.split(",");
	for(var i=0;i<quesOpts.length;i++){
		str += "<tr><td><input type='radio' onMouseDown='this.check = this.checked' onClick='if (this.check) this.checked = false' name='answers' value='"+i+"' ";
			for(var j=0;j<answers.length;j++){
				if(i==answers[j] && answers[j]!="")
					str += "checked";
			}
		str +="/> </td><td style='font-family:Arial,verdana,helvetica,sans-serif'>"+quesOpts[i]+" </td></tr>";
	}
	str += "</table></div>";
	return str;
}

function fillMSQQues (quesTxt,quesOpts,answer){
	var answers = answer.split(",");
	var str = "<div style='width:98%;margin-left:5px;font-family:Arial,verdana,helvetica,sans-serif;padding-bottom:10px'> "+quesTxt+ "</div><div style='width:100%;font-family:Arial,verdana,helvetica,sans-serif;margin-top:5px'><table>";
	for(var i=0;i<quesOpts.length;i++){
		str += "<tr><td><input type='checkbox' name='answers' value='"+i+"' ";
			for(var j=0;j<answers.length;j++){
				if(i==answers[j] && answers[j]!="")
					str += "checked";
			}
		str +="/> </td><td style='font-family:Arial,verdana,helvetica,sans-serif'>"+quesOpts[i]+" </td></tr>";
	}
	str += "</table></div>";
	return str;
}


function fillSAQues(quesTxt,answer){
	var str = "<div style='width:98%;margin-left:5px;font-family:Arial,verdana,helvetica,sans-serif;padding-bottom:10px'> "+quesTxt+ "</div><div style='width:100%;font-family:Arial,verdana,helvetica,sans-serif;margin-top:5px'>";
	str += "<br/><br/><center><input type='text' id='answer' class='keyboardInput'  value='"+answer+"'/></center></div>";
	return str;
}

var allowedChars = new Array("+","-");

function numPadValidate(text) {
	var proceed = true;
	for(var i=0;i<allowedChars.length;i++){
		if(text.indexOf(allowedChars[i])>0){
			proceed=false;
		}
		if(text.split(allowedChars[i]).length>2){
			proceed = false;
		}
	}
	if(text.indexOf('.') > -1){
		var afterDot = text.split(".");
		if(afterDot.length==2){
			if(afterDot[1].length>2)
				proceed=false;
		}else if(afterDot.length>2){
			proceed=false;
		}
	}
	return proceed;
}	

function fillCompQues(ques){
	var str ='<div style="width:98%; margin-top:5px;height:88%">';
	str += '<div style="width:49%;float:left;margin-left:5px;font-family:Arial,verdana,helvetica,sans-serif;overflow:auto;height:98%">';
	str += (iOAP.compQName.length>0)?('<table width="100%"><tr><td><div style="font-size:1em;font-family:Arial,verdana,helvetica,sans-serif"><b>'+iOAP.compQName+'</b></div></td></tr><tr><td><hr/></td></tr></table>') : "";
	str += ques.quesText.split("@@&&")[0]+' </div>';
	return str;
}

function fillSubjectiveQues(quesTxt){
	var str = "<div style='width:98%;margin-left:5px;font-family:Arial,verdana,helvetica,sans-serif'> "+quesTxt+ "</div>";
	return str;
}



function fillQuesNumber(ques){
	var str = '<table width="100%"><tr><td><div style="width:98%;margin:5px;"><div style="float : left;width:49%;font-size:1em;font-family:Arial,verdana,helvetica,sans-serif"><b> Question No. '+ques.quesID+'</b></div><div style="width:49%;float:right;">';
	if(iOAP.languages.length>2){
		str += "<div style='float:right'> <b>View In : </b> <select onchange='changeLang(this.value)'> ";
		for(var i=1;i<iOAP.languages.length;i++){
			str +="<option";
			if(i==iOAP.viewLang[iOAP.curSection][iOAP.curQues].langID)
				str += " selected='selected'";
			str +=  " value='"+i+"'>"+iOAP.languages[i]+"</option>";
		}
		str +="</select></div>";
	}
	str += '</div></td></tr>';
	str += '<tr><td></td></tr>';
	str += '<tr><td><hr/></td></tr></table>';
	return str;
}


function fillLAQuesNumber(ques){
	var str = '<table width="100%"><tr><td><div style="width:98%;margin:5px;"><div style="float : left;width:49%;font-size:1em;font-family:Arial,verdana,helvetica,sans-serif"><b>Question No. '+ques.quesID;
	str +=  ($.trim(ques.quesText.split("@@&&")[0]).length <= 0 && iOAP.laQName.length >0 )?(" ("+iOAP.laQName+")"):"";
	str +='</b></div><div style="width:49%;float:right;">';
	if(iOAP.languages.length>2){
		str += "<div style='float:right'> View In <select onchange='changeLang(this.value)'> ";
		for(var i=1;i<iOAP.languages.length;i++){
			str +="<option";
			if(i==iOAP.viewLang[iOAP.curSection][iOAP.curQues].langID)
				str += " selected='selected'";
			str +=  " value='"+i+"'>"+iOAP.languages[i]+"</option>";
		}
		str +="</select></div>";
	}
	str += '</div></td></tr><tr><td><hr/></td></tr></table>';
	return str;
}

function fillLAQues(ques){
	var str ='<div style="width:98%; margin-top:5px;height:88%">';
	str += '<div style="width:49%;float:left;margin-left:5px;font-family:Arial,verdana,helvetica,sans-serif;overflow:auto;height:98%">';
	str += (iOAP.laQName.length>0)?('<table width="100%"><tr><td><div style="font-size:1em;font-family:Arial,verdana,helvetica,sans-serif"><b>'+iOAP.laQName+'</b></div></td></tr><tr><td><hr/></td></tr></table>'):'';
	str += "<p>" +ques.quesText.split("@@&&")[0] +"</p>";
	if(iOAP.sections[iOAP.curSection][iOAP.viewLang[iOAP.curSection][iOAP.curQues].langID][iOAP.curQues-1]!=null){
		parentQues = iOAP.sections[iOAP.curSection][iOAP.viewLang[iOAP.curSection][iOAP.curQues].langID][iOAP.curQues-1];
		if(parentQues.isParent){
			if($.trim(parentQues.answer) != ""){
				str += "<p><i>Selected answer(s) of the parent question is :";
				if(parentQues.quesType.indexOf("SA") ==-1){
					var answers = parentQues.answer.split(",");
					for(var j=0;j<answers.length;j++){
						str += parentQues.options[answers[answers.length - j-1]] + ",";
					}
					str = str.substring(0,str.length-1);
				}else{
					str += parentQues.answer;
				}

				str += "</i></p>";
			}
		}
	}
	str += ' </div>';
	return str;
}


function changeLang(langID){
	iOAP.viewLang[iOAP.curSection][iOAP.curQues].langID = langID;
	getQuestion();
}

function fillQuesDetailsCont(ques){
	var str = "";
	if(iOAP.showQType){
		str +="<span class='content'>";
			if(ques.quesType=="MCQ" && $.trim(iOAP.mcQName).length>0){
				str += "Question Type : "+ iOAP.mcQName;
			}else if(ques.quesType=="MSQ" && $.trim(iOAP.msQName).length>0){
				str += "Question Type : "+iOAP.msQName;
			}else if(ques.quesType=="SA" && $.trim(iOAP.saQName).length>0){
				str += "Question Type : "+iOAP.saQName;
			}else if(ques.quesType == "SUBJECTIVE" && $.trim(iOAP.subjQName).length>0){
				str += "Question Type : "+iOAP.subjQName;
			}else if(ques.quesType == "COMPREHENSION@@MCQ" && $.trim(iOAP.mcQName).length>0){
				str+="Question Type : "+iOAP.mcQName;
			}else if(ques.quesType == "COMPREHENSION@@MSQ" && $.trim(iOAP.msQName).length>0){
				str+="Question Type : "+iOAP.msQName;
			}else if(ques.quesType == "COMPREHENSION@@SA" && $.trim(iOAP.saQName).length>0){
				str+="Question Type : "+iOAP.saQName;
			}else if(ques.quesType == "LA@@MCQ" && $.trim(iOAP.mcQName).length>0){
				str+="Question Type : "+iOAP.mcQName;
			}else if(ques.quesType == "LA@@MSQ" && $.trim(iOAP.msQName).length>0){
				str+="Question Type : "+iOAP.msQName;
			}else if(ques.quesType == "LA@@SA" && $.trim(iOAP.saQName).length>0){
				str+="Question Type : "+iOAP.saQName;
			}
		str	+= "</span>";
	}
	if(iOAP.showMarks){
		str += "<span class='marks'>Marks for correct answer : <font style='color:green'>"+ques.allottedMarks+"</font>"
		str += "; Negative Marks : <font style='color:red'>"+ques.negMarks+"</font></span>";
	}
	return str;
}

function quesContent(ques){
	var str='' ;
	$("#savenext").val("Save & Next") ;
	if(iOAP.showMarks || iOAP.showQType){
//		console.log("in");
		
		if(ques.quesType=="MCQ" && $.trim(iOAP.mcQName).length>0){
			str = "<div class='questionTypeCont'>";
			str += fillQuesDetailsCont(ques);
			str += "</div>";
		}else if(ques.quesType=="MSQ" && $.trim(iOAP.msQName).length>0){
			str = "<div class='questionTypeCont'>";
			str += fillQuesDetailsCont(ques);
			str += "</div>";
		}else if(ques.quesType=="SA" && $.trim(iOAP.saQName).length>0){
			str = "<div class='questionTypeCont'>";
			str += fillQuesDetailsCont(ques);
			str += "</div>";
		}else if(ques.quesType == "SUBJECTIVE" && $.trim(iOAP.subjQName).length>0){
			str = "<div class='questionTypeCont'>";
			str += fillQuesDetailsCont(ques);
			str += "</div>";
		}else if(ques.quesType == "COMPREHENSION@@MCQ" && $.trim(iOAP.mcQName).length>0){
			str = "<div class='questionTypeCont'>";
			str += fillQuesDetailsCont(ques);
			str += "</div>";
		}else if(ques.quesType == "COMPREHENSION@@MSQ" && $.trim(iOAP.msQName).length>0){
			str = "<div class='questionTypeCont'>";
			str += fillQuesDetailsCont(ques);
			str += "</div>";
		}else if(ques.quesType == "COMPREHENSION@@SA" && $.trim(iOAP.saQName).length>0){
			str = "<div class='questionTypeCont'>";
			str += fillQuesDetailsCont(ques);
			str += "</div>";
		}else if(ques.quesType == "LA@@MCQ" && $.trim(iOAP.mcQName).length>0){
			str = "<div class='questionTypeCont'>";
			str += fillQuesDetailsCont(ques);
			str += "</div>";
		}else if(ques.quesType == "LA@@MSQ" && $.trim(iOAP.msQName).length>0){
			str = "<div class='questionTypeCont'>";
			str += fillQuesDetailsCont(ques);
			str += "</div>";
		}else if(ques.quesType == "LA@@SA" && $.trim(iOAP.saQName).length>0){
			str = "<div class='questionTypeCont'>";
			str += fillQuesDetailsCont(ques);
			str += "</div>";
		}
	}

	if(ques.quesType == "MCQ"){
		str += "<div style='height:88%;overflow:auto;width:100%'>";
		str += fillQuesNumber(ques);
		str += fillMCQQues(ques.quesText,ques.options,ques.answer);
		str += "</div>";
	}else if(ques.quesType == "MSQ"){
		str += "<div style='height:88%;overflow:auto;width:100%'>";
		str += fillQuesNumber(ques);
		str += fillMSQQues(ques.quesText,ques.options,ques.answer);
		str += "</div>";
	}else if(ques.quesType == "SA"){
		str += "<div style='height:88%;overflow:auto;width:100%'>";
		str += fillQuesNumber(ques);
		str += fillSAQues(ques.quesText,ques.answer,ques.quesID);
		str += "</div>";
	}else if(ques.quesType == "SUBJECTIVE"){
		$("#savenext").val("Mark as Answered") ;
		str += "<div style='height:88%;overflow:auto'>";
		str += fillQuesNumber(ques);
		str += fillSubjectiveQues(ques.quesText);
		str += "</div>";
	}else if(ques.quesType == "COMPREHENSION@@MCQ" || ques.quesType == "COMPREHENSION@@MSQ" || ques.quesType == "COMPREHENSION@@SA"){
		str += fillCompQues(ques);
		str += '<div style="width:49%;float:right;border: solid 0 #000; border-left-width:1px;overflow:auto;height:88%">';
		str += fillQuesNumber(ques);
		if(ques.quesType == "COMPREHENSION@@MCQ" ){
			str += fillMCQQues(ques.quesText.split("@@&&")[1],ques.options,ques.answer);
		}else if(ques.quesType == "COMPREHENSION@@MSQ" ){
			str += fillMSQQues(ques.quesText.split("@@&&")[1],ques.options,ques.answer);
		}else if(ques.quesType == "COMPREHENSION@@SA" ){
			str += fillSAQues(ques.quesText.split("@@&&")[1],ques.answer);
		}
		str +='</div></div>';
	}else if(ques.quesType == "LA@@MCQ" || ques.quesType == "LA@@MSQ" || ques.quesType == "LA@@SA"){
		var laQues = ques.quesText.split("@@&&");
		if($.trim(laQues[0]).length >0){
			str += fillLAQues(ques);
			str += '<div style="width:49%;float:right;border: solid 0 #000; border-left-width:1px;overflow:auto;height:88%">';
		}else{
			str += "<div style='height:88%;overflow:auto'>";
		}
		str += fillLAQuesNumber(ques);
		if(ques.quesType == "LA@@MCQ" ){
			str += fillMCQQues(ques.quesText.split("@@&&")[1],ques.options,ques.answer);
		}else if(ques.quesType == "LA@@MSQ" ){
			str += fillMSQQues(ques.quesText.split("@@&&")[1],ques.options,ques.answer);
		}else if(ques.quesType == "LA@@SA" ){
			str += fillSAQues(ques.quesText.split("@@&&")[1],ques.answer);
		}
		if($.trim(str.split("@@&&")[1]).length >0)
			str +='</div></div>';
	}
	return str;
}

function fillSections(){
	var str="<table width='100%'>";
	for(i=1;i< iOAP.secDetails.length ;i++){
		var answeredQuestions = iOAP.secDetails[i].answered;
		var notAnsweredQuestions = iOAP.secDetails[i].notanswered;
		var markedQuestions = iOAP.secDetails[i].marked;
		var noOfQuestions = iOAP.sections[i][1].length;
		var notAttemptedQuestions = noOfQuestions - markedQuestions - notAnsweredQuestions - answeredQuestions-1;
		if(i%5==1){
			str+="</td></tr>";
			str+="<tr><td>";
		}
		str+='<div class="allSections" id="s'+i+'" ><a href="#" class="tooltip">';
		str+='<div style="text-overflow:ellipsis;width:90%;overflow:hidden;white-space:nowrap;padding-left:10px;">';
		if(iOAP.secDetails[i].isOptional == 'Y'){
			str += '<input name="optSec" id="opt'+i+'"';
			if(iOAP.secDetails[i].isSelected == true)
				str += ' checked ';
			str += 'type="checkbox"></input>';
		}
		str += iOAP.secDetails[i].secName+'</div>';
		str += '<span class="classic"><center><table width="95%" style="font-size:14px;margin-top:10px" class="question_area" cellspacing="0">';
		str += '<tr><td colspan="2"><b>'+iOAP.secDetails[i].secName+'</b></td></tr>';
		str += '<tr><td colspan="2"><hr/></td></tr></table>';
		str += '<table width="95%" style="margin-top:0%" class="question_area" cellspacing="5">';
		str += '<tr><td style="text-align:left;padding-top:10px" width="80%">Answered: </td><td valign="top"><span id="tooltip_answered">'+answeredQuestions+'</span></td></tr>';
		str += '<tr><td style="text-align:left;padding-top:10px" width="80%">Not Answered: </td><td valign="top"><span  id="tooltip_not_answered">'+notAnsweredQuestions+'</span></td></tr>';
		str += '<tr><td style="text-align:left;padding-top:10px" width="80%">Marked for Review: </td><td valign="top"><span id="tooltip_review">'+markedQuestions+'</span></td></tr>';
		str += '<tr><td style="text-align:left;padding-top:10px" width="80%">Not Visited: </td><td valign="top"><span id="tooltip_not_visited">'+notAttemptedQuestions+'</span></td></tr>';
		str += '</table></center></span>';
		str += '</a></div>';
	}
	str +="</td></tr></table>";
	$('#sections').html(str);
	//align 
	if( iOAP.secDetails.length>4 && $.browser.msie ){
		for(var i=4;i<iOAP.secDetails.length;i=i+5){
			$('#s'+(i+1)+" .tooltip").hover(
				function(){ $(this).find(".classic").css({"margin-left":"-60px"});}
				, function(){$(this).find(".classic").css({"margin-left":"-999px"});});
		}
	}

	$("#s"+iOAP.curSection).addClass("currentSectionSelected");
	$("#s"+iOAP.curSection+" a").addClass("tooltipSelected");
	$(".allSections input").click(function(event){
		if(this.checked){
			optSecCheck(this.id.split("opt")[1],event);
		}
		else{
			optSecUncheck(this.id.split("opt")[1],event);
		}
	});
	$(".allSections").click(function (event){
		if(event.target.type!="checkbox"){
			changeSection(this.id.split("s")[1]);
		}
	});
}

function optSecCheck(secId,event){
	var optSections = document.getElementsByName("optSec");
	var counter = 0;
	for(i=1;i<iOAP.secDetails.length;i++){
		if(iOAP.secDetails[i].isOptional=='Y' && iOAP.secDetails[i].isSelected){
			counter++;
		}
	}
	counter++;
	if(counter>iOAP.maxNoOptSec){
		event.preventDefault();
		if(event.stopPropagation){
			event.stopPropagation();
		}else
			event.returnValue=false;
		secChangeConfirmation();
	}else{
		iOAP.secDetails[secId].isSelected = true;
		enableOptButtons();
	}
}

function optSecUncheck(secId,event){
	event.preventDefault();
	if(event.stopPropagation){
		event.stopPropagation();
	}else{
		event.returnValue=false;
	}
	var str= "";
	str ="<center><p style='margin-top:5%'><i>Deselecting the checkbox will DELETE all the options marked in this section. Do you want to continue?</i></p><br/>";
	str +="<table align='center' style='margin-top:5%'>";
	str +='<tr><td style="text-align:center"><input onclick="resetSection('+secId+');afterResetSection();" type="button" class="button" value="Reset"/></td><td  style="text-align:center"><input onclick="showModule(';
	str +="'questionCont'";
	str +=')" type="button" class="button" value="Back"/></td></tr></table></center>';
	$("#sectionSummaryDiv").html(str);
	showModule('sectionSummaryDiv');
}

function resetSection(secId){
	var counter = 0;
	for(var i=1;i<iOAP.sections[secId].length;i++){
		for(var j=1;j<iOAP.sections[secId][i].length;j++){
			iOAP.sections[secId][i][j].answer = '';
			if(iOAP.viewLang[secId][j].status != 'notAttempted'){
				iOAP.viewLang[secId][j].status="notanswered";
				counter++;
			}
		}
	}
	iOAP.secDetails[secId].answered = 0;
	//we are dividing here because the counter counts in all the languages.
	iOAP.secDetails[secId].notanswered = counter/(iOAP.sections[secId].length-1); 
	iOAP.secDetails[secId].marked = 0;
	iOAP.secDetails[secId].isSelected = false;
}

function afterResetSection(){
	showModule('questionCont');
	fillSections();
	enableOptButtons();
	fillNumberPanel();
}

function enableOptButtons(){
	$("#savenext").removeAttr("title");
	$("#underreview").removeAttr("title");
	$("#savenext").removeAttr("disabled");
	$("#underreview").removeAttr("disabled");
	if(iOAP.secDetails[iOAP.curSection].isOptional == 'Y' && !iOAP.secDetails[iOAP.curSection].isSelected){
		$("#savenext").attr("title","Select the section to attempt this question");
		$("#underreview").attr("title","Select the section to attempt this question");
		$("#savenext").attr("disabled","disabled");
		$("#underreview").attr("disabled","disabled");
	}
}

function secChangeConfirmation(){
	var quesStatus;
	var noOfAns=0,noOfNtAns=0,noOfReview=0,noOfNtAttemp=0,totalQues=0;
	var str= "";
	str +="<center><p style='margin-top:5%;width:75%;text-align:left'><font color='red'>WARNING! You can attempt only "+iOAP.maxNoOptSec+" of the "+(iOAP.noOptSec)+" optional section(s)."; 
	str += " You have chosen to change the optional section. You are required to reset the previously chosen optional sections by clicking on the corresponding checkbox in the table given below and a click on Reset button. ";
	str += "Please be aware that by resetting one of the following sections, all the answers you have provided for this section will be DELETED. (If you choose to come back to this section later, you will have to start afresh. Hence if you think you will need to come back to this section, note down your answers on the notepad provided before switching sections). Are you sure you want to Reset a section now?";
	str += "<br/><br/>If YES, check the checkbox next to section you wish to reset and click on <b>Reset</b> button to reset that section. </font></p>";
	str += "<center><b>Summary of Optional Section(s) : </b></center>";
	str += "<table class='bordertable' cellspacing=0 width='60%' align='center' >";
	str += "<tr><th>Optional Section Name</th><th>No. of Questions</th><th>Answered</th><th>Not Answered</th><th>Marked for Review</th><th>Not Visited</th><th> Reset </th></tr>";
	for(var i=1;i<iOAP.secDetails.length;i++){
		if(iOAP.secDetails[i].isOptional=='Y'){
			if(iOAP.secDetails[i].isSelected){
				str += "<tr><td>"+iOAP.secDetails[i].secName+"</td><td>"+(iOAP.sections[i][1].length-1)+"</td><td>"+iOAP.secDetails[i].answered+"</td><td>"+iOAP.secDetails[i].notanswered+"</td><td>"+iOAP.secDetails[i].marked+"</td><td>"+(iOAP.sections[i][1].length-iOAP.secDetails[i].answered-iOAP.secDetails[i].notanswered-iOAP.secDetails[i].marked-1)+"</td><td><input type='checkbox' ";
				str += " value="+i+" name='confSec'/></td></tr>";
			}
		}
	}
	str += "</table></center>";
	str +="<center><table align='center' style='margin-top:1%' ><tr><td colspan=2 id='errorMsg'>&nbsp;</td></tr>";
	str +='<tr><td style="text-align:center"><input onclick="confirmChangeSec()" type="button" class="button" value="Reset"/></td><td  style="text-align:center"><input onclick="showModule(';
	str +="'questionCont'";
	str +=')" type="button" class="button" value="Back"/></td></tr></table></center>';
	$("#sectionSummaryDiv").html(str);
	showModule('sectionSummaryDiv');
}

function finalSecChangeConf(secIds){
	if($.trim(secIds) != ""){
		var sections = secIds.split(",");
		for(var i = 0;i<sections.length-1;i++){
				resetSection(sections[i]);
		}
	}
	afterResetSection();
}

function confirmChangeSec(){
	var allCheckedSections = document.getElementsByName("confSec");
	var secIds = "";
	for(var i = 0;i<allCheckedSections.length;i++){
		if(allCheckedSections[i].checked)
			secIds += allCheckedSections[i].value+","
	}
	var sections = secIds.split(',');
	if(sections.length>1){
		var str = "";
		str = "<center><table cellspacing=0 width='60%' align='center' style='margin-top:5%'>";
		str += "<tr><td colspan=2 style='text-align:center'>Resetting this section will DELETE your responses to all the questions in this section. Are you sure you want to reset section ";
		for(var i =0 ; i<sections.length-1 ; i++){
			//console.log(sections[i]);
			str += iOAP.secDetails[sections[i]].secName +" ,";
		}
		str  = str.substring(0,str.length-2);
		str += " ?</td></tr><tr><td colspan=2>&nbsp;</td></tr><tr><td colspan=2>&nbsp;</td></tr>";
		str +='<tr><td style="text-align:right;margin-right:5px"><input onclick="finalSecChangeConf(';
		str += "'"+secIds+"'";
		str += ')" type="button" class="button" value="Reset"/></td><td  style="text-align:left;margin-left:5px"><input onclick="showModule(';
		str +="'questionCont'";
		str +=')" type="button" class="button" value="Back"/></td></tr></table></center>';
		$("#sectionSummaryDiv").html(str);
	}else{
		$('#errorMsg').html('<center><font style="color:red;font-weight:bold">Please select the section(s) to reset</font></center>');
	}
}

function changeSection (sectionID){
	if(sectionID!=iOAP.curSection){
		iOAP.curSection = sectionID;
		iOAP.curQues = 1;
	}
	enableOptButtons();
	changeQues(iOAP.curQues);
	numPanelSec();
	getQuestion();
	fillNumberPanel();	
}

function fillNumberPanel(){
	var quesStatus;
	var str = '<center><table style="margin-top:-2%;" cellspacing="0" class="question_area " cellpadding="0" border="0" valign="top"><tr>';
	for(i=1;i<iOAP.viewLang[iOAP.curSection].length;i++){
		if(i%4==1){
			str+='</tr>';
			str+='<tr>';
		}
		quesStatus=iOAP.viewLang[iOAP.curSection][i].status ;
		if(quesStatus=="answered"){
			str+='<td><span title ="Answered" class="answered" id="'+i+'" onclick="javascript:changeQues('+i+');"> '+i+'</span></td>';
		}else if(quesStatus=="notanswered"){
			str+='<td><span title ="Not Answered" class="not_answered" id="'+i+'" onclick="javascript:changeQues('+i+');"> '+i+'</span></td>';
		}else if(quesStatus=="marked"){
			if(iOAP.sections[iOAP.curSection][iOAP.viewLang[iOAP.curSection][i].langID][i].answer == null ||  iOAP.sections[iOAP.curSection][iOAP.viewLang[iOAP.curSection][i].langID][i].answer == ''){
				str+='<td><span title ="Marked & Not Answered" class="review" id="'+i+'" onclick="javascript:changeQues('+i+');"> '+i+'</span></td>';
			}else{
				str+='<td><span title ="Marked & Answered" class="review_answered" id="'+i+'" onclick="javascript:changeQues('+i+');"> '+i+'</span></td>';
			}
			
			
		}
		else{
			str+='<td><span title ="Not attempted" class="not_visited" id="'+i+'" onclick="javascript:changeQues('+i+');"> '+i+'</span></td>';
		}
	}
	str+='</tr></TBODY></table></center>';
	$('#numberpanelQues').html(str);
}

function changeQues(quesID){
	iOAP.curQues = quesID;
	showModule("questionCont");
	getQuestion();
	fillNumberPanel();
}

function showModule(moduleName){
	for(var i=0;i<iOAP.modules.length;i++){
		if(iOAP.modules[i]==moduleName){
			$("#"+iOAP.modules[i]).show();
		}else{
			$("#"+iOAP.modules[i]).hide();
		}
	}
}

function numPanelSec(){
	$('#viewSection').html('You are viewing <b>'+iOAP.secDetails[iOAP.curSection].secName+ '</b> section <br/>Question Palette : ');
}

function resetOption(){
	var ques = iOAP.sections[iOAP.curSection][iOAP.viewLang[iOAP.curSection][iOAP.curQues].langID][iOAP.curQues];
	iOAP.sections[iOAP.curSection][iOAP.viewLang[iOAP.curSection][iOAP.curQues].langID][iOAP.curQues].answer = '';
	if(ques.quesType =="SA" || ques.quesType =="COMPREHENSION@@SA" || ques.quesType =="LA@@SA" ){
		document.getElementById('answer').value='';
	}else{
	var answers = document.getElementsByName('answers');
		for(i=0;i<answers.length;i++)
		{
			if(answers[i].checked==true)
				answers[i].checked=false;
		}
	}
	fnSubmit('RESET');
}

function submitConfirmation(param){
	var quesStatus;
	var noOfAns=0,noOfNtAns=0,noOfReview=0,noOfNtAttemp=0,totalQues=0;
	var str= "";
	str = "<center><h3><b>Summary of Section(s) Answered</b></h3>";
	str += "<table class='bordertable' cellspacing=0 width='60%' align='center' style='margin-top:5%'>";
	str += "<tr><th>Section Name</th><th>No. of Questions</th><th>Answered</th><th>Not Answered</th><th>Marked for Review</th><th>Not Visited</th></tr>";
	for(var i=1;i<iOAP.secDetails.length;i++){
		if(iOAP.secDetails[i].isOptional=='N'){
			str += "<tr><td>"+iOAP.secDetails[i].secName+"</td><td>"+(iOAP.sections[i][1].length-1)+"</td><td>"+iOAP.secDetails[i].answered+"</td><td>"+iOAP.secDetails[i].notanswered+"</td><td>"+iOAP.secDetails[i].marked+"</td><td>"+(iOAP.sections[i][1].length-iOAP.secDetails[i].answered-iOAP.secDetails[i].notanswered-iOAP.secDetails[i].marked-1)+"</td></tr>";
			noOfAns = noOfAns + iOAP.secDetails[i].answered;
			noOfNtAns = noOfNtAns + iOAP.secDetails[i].notanswered;
			noOfReview = noOfReview + iOAP.secDetails[i].marked;
			totalQues = totalQues + iOAP.sections[i][1].length-1;
			noOfNtAttemp = noOfNtAttemp + iOAP.sections[i][1].length-iOAP.secDetails[i].answered-iOAP.secDetails[i].notanswered-iOAP.secDetails[i].marked-1;
		}else if(iOAP.secDetails[i].isOptional=='Y' && iOAP.secDetails[i].isSelected){
			noOfAns = noOfAns + iOAP.secDetails[i].answered;
			noOfNtAns = noOfNtAns + iOAP.secDetails[i].notanswered;
			noOfReview = noOfReview + iOAP.secDetails[i].marked;
			totalQues = totalQues + iOAP.sections[i][1].length-1;
			noOfNtAttemp = noOfNtAttemp + iOAP.sections[i][1].length-iOAP.secDetails[i].answered-iOAP.secDetails[i].notanswered-iOAP.secDetails[i].marked -1;
			str += "<tr><td>"+iOAP.secDetails[i].secName+"</td><td>"+(iOAP.sections[i][1].length-1)+"</td><td>"+iOAP.secDetails[i].answered+"</td><td>"+iOAP.secDetails[i].notanswered+"</td><td>"+iOAP.secDetails[i].marked+"</td><td>"+(iOAP.sections[i][1].length-iOAP.secDetails[i].answered-iOAP.secDetails[i].notanswered-iOAP.secDetails[i].marked-1)+"</td></tr>";
		}
	}
	str +="<tr><td><b>Total</b></td><td><b>"+totalQues+"</b></td><td><b>"+noOfAns+"</b></td><td><b>"+noOfNtAns+"</b></td><td><b>"+noOfReview+"</b></td><td><b>"+noOfNtAttemp+"</b></td></tr>";
	str += "</table></center>";
	if(param == 'submit'){
		str +="<center><table align='center' style='margin-top:5%'><tr><td colspan='2'>Do you want to submit the online exam</td></tr>";
		str +='<tr><td style="text-align:center"><input onclick="finalSubmit()" type="button" class="button" value="Yes"/></td><td  style="text-align:center"><input onclick="showModule(';
		str +="'questionCont'";
		str +=')" type="button" class="button" value="No"/></td></tr></table></center>';
	}else if(param == 'timeout'){
		str += "<center><input onclick='window.location.href = "+'"FeedBack.html"'+"' type='button' class='button' value='Next'/></center>";
	}
	$("#sectionSummaryDiv").html(str);
	showModule('sectionSummaryDiv');
}

function finalSubmit(){
	var str ="<center><table style='margin-top:5%'><tr><td colspan='2'>Are you sure you want to submit the online exam</td></tr>";
	str +='<tr><td style="text-align:center"><input onclick="fnSubmit(';
	str += "'SUBMIT'";
	str += ')" type="button" class="button" value="Yes"/></td><td  style="text-align:center"><input onclick="showModule(';
	str +="'questionCont'";
	str +=')" type="button" class="button" value="No"/></td></tr></table></center>';
	$("#sectionSummaryDiv").html(str);
}

function fnSubmit(action){
	var ques=iOAP.sections[iOAP.curSection][iOAP.viewLang[iOAP.curSection][iOAP.curQues].langID][iOAP.curQues];
	var selectedAnswer="";
	if(action != "SKIP"){
		if(ques.quesType =="SA" || ques.quesType =="COMPREHENSION@@SA" || ques.quesType =="LA@@SA"){
			selectedAnswer = document.getElementById('answer').value;
		}else if(ques.quesType != "SUBJECTIVE"){
			var answers = document.getElementsByName('answers');
			for(var i=0;i<answers.length;i++)
			{
				if(answers[i].checked==true)
				{
					selectedAnswer=answers[i].value + "," + selectedAnswer;
				}
			}
			if(selectedAnswer !="")
				selectedAnswer = selectedAnswer.substring(0,selectedAnswer.length-1); 

		}
		for(i=1;i<iOAP.sections[iOAP.curSection].length;i++){
			iOAP.sections[iOAP.curSection][i][iOAP.curQues].answer = selectedAnswer;
		}
	}
	
	if(action!='SUBMIT')
	{
		save(selectedAnswer, action,ques.quesType);
	}
	else
	{
		window.location.href = 'FeedBack.html';
	}
}



function save(ansID, action,quesType){
	var quesStatus = iOAP.viewLang[iOAP.curSection][iOAP.curQues].status;
	var sec = iOAP.secDetails[iOAP.curSection];
	if(ansID == "" && quesType != "SUBJECTIVE")
		ansID = null;
	if(action=="MARK"){
		if(quesStatus=="answered"){
			iOAP.secDetails[iOAP.curSection].answered--;
		}else if(quesStatus=="notanswered"){
			iOAP.secDetails[iOAP.curSection].notanswered--;
		}
		if(quesStatus!="marked"){
			iOAP.secDetails[iOAP.curSection].marked++;
		}
		iOAP.viewLang[iOAP.curSection][iOAP.curQues].status="marked";
	}else if(action=="RESET"){
		if(quesStatus=="marked"){
			iOAP.secDetails[iOAP.curSection].marked--;
			iOAP.secDetails[iOAP.curSection].notanswered++;
		}else if(quesStatus=="answered"){
			iOAP.secDetails[iOAP.curSection].answered--;
			iOAP.secDetails[iOAP.curSection].notanswered++;
		}
		iOAP.viewLang[iOAP.curSection][iOAP.curQues].status="notanswered";
	}else if(action=="NEXT"){
		if(ansID==null){
			if(quesStatus!="notanswered"){
				iOAP.secDetails[iOAP.curSection].notanswered++;
				iOAP.secDetails[iOAP.curSection].marked--;
			}
			iOAP.viewLang[iOAP.curSection][iOAP.curQues].status="notanswered";
		}else{
			if(quesStatus!="answered"){
				if(quesStatus=="marked")
					iOAP.secDetails[iOAP.curSection].marked--;
				if(quesStatus=="notanswered")
					iOAP.secDetails[iOAP.curSection].notanswered--;
				iOAP.secDetails[iOAP.curSection].answered++;
			}
			iOAP.viewLang[iOAP.curSection][iOAP.curQues].status="answered";		
		}
	}
	
	if(action=="NEXT" || action=="MARK" || action=="SKIP"){
		var secQuesLength= iOAP.sections[iOAP.curSection][iOAP.viewLang[iOAP.curSection][iOAP.curQues].langID].length ;     	
		if(iOAP.curQues<secQuesLength-1){
			iOAP.curQues = iOAP.curQues + 1;
			getQuestion();
			numPanelSec()
			fillNumberPanel();
		}
		else{
			if(iOAP.curSection==iOAP.sections.length-1){
				//jConfirm('You have reached the last question of the exam.Do you want to go to the first question again?', 'iAEC Confirmation', function(r) {
					bConfirm();
					/*if(r == true){
						iOAP.curSection = 1;
						iOAP.curQues = 1;
						getQuestion();
						numPanelSec()
						fillNumberPanel();
					}*/
				/*});	*/
			}else{
				iOAP.curSection++;
				iOAP.curQues = 1;
				getQuestion();
				numPanelSec()
				fillNumberPanel();
			}

		}
	}else{
		getQuestion();
		numPanelSec()
		fillNumberPanel();
	}

}

function bConfirm(){
	$('#pWait').css({"background":"none","opacity":"1","width":"99%","height":"98%"});
	var str = '<div style="top:40%;left:30%;width:400px;position:relative;background:white;border:2px solid #000"><h1 id="popup_title" class="confirm"></h1>';
	str += '<div id="popup_content" class="confirm">'+
		'<div id="popup_message">You have reached the last question of the exam.Do you want to go to the first question again?</div>'+
		'<div id="popup_panel">'+
			'<input type="image" id="popup_ok" value="&nbsp;OK&nbsp;" onclick="bConfirmOK()" src="images/ok_new.gif">'+
			'<input type="image" id="popup_cancel" value="&nbsp;Cancel&nbsp;" onclick="bConfirmCancel()" src="images/cancel_new.gif">'+
		'</div>'+
	'</div></div>';
	$('#pWait').html(str);
	$('#pWait').show();
}

function bConfirmOK(){
	iOAP.curSection = 1;
	iOAP.curQues = 1;
	getQuestion();
	numPanelSec();
	fillNumberPanel();
	$("#pWait").hide();
}

function bConfirmCancel(){
	getQuestion();
	numPanelSec();
	fillNumberPanel();
	$("#pWait").hide();
}

function timer(){
	if(iOAP.secWiseTimer==0){
		startCounter(iOAP.time);
	}
}

function startCounter(time){
	$("#showTime").html( "<b>Time Left : "+convertTime(time)+"</b>");
	if(time<iOAP.minSubmitTime){
		$("#finalSub").removeAttr("disabled");
	}else{
		$("#finalSub").attr("disabled","true");
	}
	if(time>0)
		setTimeout(function(){startCounter(time-1)},1000);
	else{
		alert("Time out !!! Your answers have been saved successfully");
		//window.location.href="FeedBack.html";
		timeOutSubmit();
	}

}

function timeOutSubmit(){
	submitConfirmation('timeout');
	$("#pWait").hide();
	$("#sectionSummaryDiv").css({"height":"80%","border":"1px #fff solid"});
	$('#sectionsField').html('');
	$('#sectionsField').css({"border":"1px #fff solid"});
	$('#assessmentname').html('');
	$('#timer').html('');
	$('.numberpanel').html('');
	$('.numberpanel').css({"background":"#fff","border-left":"1px #000 solid"});
	$('.numberpanel').html('<div style="top:25%;position:relative"><center><img src="images/NewCandidateImage.jpg" height="50%" /> </center></div>');
}

function convertTime(time){
	return showMin(time)+":"+showSec(time);
}


function showMin(time){
	var min = "";
//	time = time%3600;
	if((time/60)>9)
		min = parseInt(time/60);
	else
		min = "0"+parseInt(time/60);
	return min;
}

function showSec(time){
	var sec="";
	if((time%60)>9)
		sec = time%60;
	else
		sec = "0"+time%60;
	return sec;	
}


/* Time in hours
function convertTime(time){
	return showHr(time)+":"+showMin(time)+":"+showSec(time);
}

function showHr(time){
	return "0"+parseInt(time/3600);
}

function showMin(time){
	var min = "";
	time = time%3600;
	if((time/60)>9)
		min = parseInt(time/60);
	else
		min = "0"+parseInt(time/60);
	return min;
}

function showSec(time){
	var sec="";
	if((time%60)>9)
		sec = time%60;
	else
		sec = "0"+time%60;
	return sec;	
}
*/
function imgMagnifyInc( img,percentage){	
	var width = img.width;
	var height = img.height;
	height= height + height*percentage/100;
	width = width+ width*percentage/100;
	var zindex=1;
	if(percentage>0)
		zindex = 999;
	$(img).css({"height":height,"width":width,"z-index":zindex,"position":"relative"});	
}

function showQP(){
	var i,j;
	var str = "";
	var noOfQues = new Array();
	var quesCounter=0;
	var counter =0;
	var addQuesGroupCounter = false;
	for(i=1;i<iOAP.viewLang.length;i++){
		for(j=1;j<iOAP.viewLang[i].length;j++){
			ques = iOAP.sections[i][iOAP.viewLang[i][j].langID][j];
			if(ques.quesType.indexOf("@@") !=-1 ){
				if(ques.isParent){
					if(!addQuesGroupCounter){
						addQuesGroupCounter = true;
					}else{
						noOfQues[quesCounter]= counter;
						quesCounter++;
					}
					counter=1;
				}else{
					counter++;
				}
			}else{
				if(counter>1){
					noOfQues[quesCounter]= counter;
					quesCounter++;
				}
				counter=1;
			}
		}
	}
	quesCounter=0;

	for(i=1;i<iOAP.viewLang.length;i++){
		str +="<h2><font color='#2F72B7'>Section : "+iOAP.secDetails[i].secName+"</font></h2>" ;
		for(j=1;j<iOAP.viewLang[i].length;j++){
			ques = iOAP.sections[i][iOAP.viewLang[i][j].langID][j];
			if(ques.quesType.indexOf("@@") !=-1 ){
				str += "<p style='padding-left:5px'>";
				if(ques.isParent){
					if(ques.quesType.split("@@")[0] == "COMPREHENSION" ){
						str += "<b>"+iOAP.compQName ;
					}
					else if(ques.quesType.split("@@")[0] == "LA"){
						str += "<b>"+iOAP.laQName ;
					}
					str += "(Question Number "+j+" to "+(j+noOfQues[quesCounter]-1)+") :</b> <br/> "+ques.quesText.split("@@&&")[0] + "<br/>";
					quesCounter++;
				}
				str += "<table><tr><td valign='top' width='50px'>Q. "+j+") </td><td>"+ ques.quesText.split("@@&&")[1]+"</td>";
			}else{
				str += "<p style='padding-left:5px'><table><tr><td>Q. "+j+") </td><td>"+ ques.quesText+"</td></tr>";
			}
			str += "<tr><td width='50px'></td><td><i style='font-size:1em;'>";
			if(ques.quesType.indexOf("MCQ")>-1 && iOAP.mcQName.length>0){
				str += "Question Type : <b>";
				str += iOAP.mcQName;
				str += "</b>;";
			}else if(ques.quesType.indexOf("MSQ")>-1 && iOAP.msQName.length > 0){
				str += "Question Type : <b>";
				str += iOAP.msQName;
				str += "</b>;";
			}else if(ques.quesType.indexOf("SA")>-1 && iOAP.saQName.length>0){
				str += "Question Type : <b>";
				str += iOAP.saQName;
				str += "</b>;";
			}else if(ques.quesType.indexOf("SUBJECTIVE")>-1 && iOAP.mcQName > 0){
				str += "Question Type : <b>";
				str += iOAP.subjQName;
				str += "</b>;";
			}
			if(iOAP.showMarks){
				str += " Marks for correct answer :<font color='green'><b> "+ ques.allottedMarks +"</b></font>";
				str += "; Negative Marks  :<font color='red'><b> "+ ques.negMarks +"</b></font>";
			}
			str += "</i><td></tr>";
			str += "</table></p><hr style='color:#ccc'/>";
		}
		str +="<br/>";
	}
	$("#viewQPDiv").html(str);
	showModule('QPDiv');
}

function multiLangInstru(){
	$("#basInst option[value='instEnglish']").attr("selected", "selected");
	if(document.getElementById("multiLangDD")!=null){
		$("#multiLangDD option").each(function(){
			if($(this).text().toUpperCase() == 'HINDI'){
				$('#basInst').parent().show();
			}
		});
		$("#multiLangDD").change(function (){ 
			var select = this.value;
			$("#multiLangDD option").each(function(){
				
				if(select == this.value){
					$("#instLang" + select).show();
				}else{
					$("#instLang" + this.value).hide();
				}
			});
		});
	}
}


function basInst(param){
			if(param=='instEnglish'){
				$('#instEnglish').show();
				$('#instHindi').hide();
			}else{
				$('#instEnglish').hide();
				$('#instHindi').show();
			}
		}
