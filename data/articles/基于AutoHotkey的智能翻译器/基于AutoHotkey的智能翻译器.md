# 基于AutoHotkey的智能翻译器

> 原创 已于 2025-12-07 00:09:25 修改 · 1.5k 阅读 · 1 · 4 · CC 4.0 BY-SA版权 版权声明：本文为博主原创文章，遵循 CC 4.0 BY-SA 版权协议，转载请附上原文出处链接和本声明。
> 文章链接：https://blog.csdn.net/aaa_8051/article/details/121589641

**基于AutoHotkey的便捷翻译器SmartTranslator**

[TOC]



## 用AHK写的智能翻译器，支持查词和翻译

#### 1.API接口

- 词典接口：海词、词霸、有道。

- 翻译接口：谷歌、百度、有道。

#### 2.功能简述

- 支持中英文自动识别，无需设置源语言和目标语言

- 支持句子和单词自动识别，不需要其他切换操作

- 未完待续···

#### 3.使用方法

- 第一步：选择需要查询的单词或者需要翻译的句子

- 第二步：长按右键(或者按下快捷键window + c )直接查词或者翻译

- 第三步：翻译完成后，在鼠标附近弹出窗口显示翻译结果，鼠标置于文字上，弹窗永不消失，离开弹窗一秒，窗口自动关闭

- 第四步：在翻译结果文字上按下左键，会替换当前被翻译的内容；按下右键，则将结果复制到剪贴板

#### 4.操作演示

![操作演示](./assets/0_1.gif)

#### 5.源代码

- ①主函数

```c
;@Ahk2Exe-SetMainIcon Icon\SmartTranslator.ico
;@Ahk2Exe-AddResource Icon\SmartTranslator.ico, 160  
;@Ahk2Exe-SetProductName SmartTranslator

;不显示托盘图标
;#NoTrayIcon
;跳过对话框, 自动替换旧实例
#SingleInstance force
;设置工作目录
SetWorkingDir %A_ScriptDir%
;不检查空变量是否为环境变量
#NoEnv
;启用或禁用可能产生错误的特定状况时的警告, 例如书写错误或缺少全局声明
;#Warn 
;让脚本保持后台运行
#Persistent
;防止用户的击键与发送的击键穿插在一起
SendMode Input  
/*
**********************************include Start*******************************************
*/

#include WinHttpRequests.ahk
#include TranslateAPI.ahk
#Include <Basic>

/*
**********************************include End*********************************************
*/



/*
**********************************Global start*********************************************
*/

Global TranslateResults := "Welcome to the SmartTranslator"
/*
**********************************global End*********************************************
*/

/*
**********************************Init Code Start*******************************************
*/
ShowWizard()
ConfingInit()
TrayInit()
return
/*
**********************************Init Code End*********************************************
*/

/*
**********************************User Code Start*******************************************
*/

#c::
    ClipboardAnalyze()
return 
$RButton::
    KeyWait, RButton, T0.25
    if (ErrorLevel = 1)
        ClipboardAnalyze()
    else
        Send, {RButton}
Return

ClipboardAnalyze()
{
	Global
	clipboard := ""
    send ^{c}
    ClipWait, 1
    Clipboard := StrReplace(Clipboard, "`r`n", " ")
    if RegExMatch(clipboard, "[一-鬼]")	;查找汉字.
    {
        ;中文模式
        dictOut := StrReplace(Clipboard, A_Tab)
        dictOut := StrReplace(dictOut, A_Space)
        if (strlen(dictOut) >3 || RegExMatch(dictOut, "[^一-鬼]") != 0 )
        {   ;翻译模式
			TranslateResults := Select_Dict_Trans("Trans",dictOut)
        }
        Else
        {   ;词典模式
			TranslateResults :=	Select_Dict_Trans("Dict",dictOut)
			if(strlen(Results) = 0)
				TranslateResults :=	Select_Dict_Trans("Trans",dictOut)
        }
    }
    else
    {
        ;英文模式
        dictOut := StrReplace(Clipboard, A_Tab)
        pos := RegExMatch(dictOut, "\s")
        pos += 1
        ;查找是否含有字母、空格之外的符号
        if (RegExMatch(dictOut, "[^a-zA-Z\s]", var) || RegExMatch(dictOut, "\s",, pos))	 
        {   ;翻译模式
			TranslateResults := Select_Dict_Trans("Trans",dictOut)
        }
        Else
        {   ;词典模式
			TranslateResults :=	Select_Dict_Trans("Dict",dictOut)
			if(strlen(TranslateResults)=0)
				TranslateResults :=	Select_Dict_Trans("Trans",dictOut)
        }

    }
   	GuiTip(TranslateResults)
	Clipboard := ""
    return
}

/*
**********************************User Code End*********************************************
*/

/*
**********************************Gui Code Start*********************************************
*/
/*
GUI内容显示
*/
;@Ahk2Exe-Bin ,,"UTF-8"
GuiTip(message := "Welcome to use the SmartTranslator!")
{
    Global varText := message
    If (StrLen(message)>=300) 
	{
		W_0 := "w950"
	} 
	Else If (StrLen(message)>=100) 
	{
		W_0 := "w700"
	} Else If (StrLen(message)>=55) 
	{
		W_0 := "w500"
	} Else
		W_0 := ""
    Gui, GuiTip:Destroy 
	Gui, GuiTip:+ToolWindow +HwndGuiTip_A -Caption +AlwaysOnTop border -DPIScale
	Gui, GuiTip:Color, cDDDDDD
	Gui, GuiTip:Font, s13 c2D2D2D Q5, 微软雅黑
	Gui, GuiTip:Margin, 5, 5
    Gui, GuiTip:Add, Text, X0 %W_0% gGuiTipText, %message%
    Gui, GuiTip:Font, s10 c333333 Q5, 微软雅黑
	CoordMode, Mouse
	MouseGetPos, Mu_XX, Mu_YY
	Gui_XX := Mu_XX+10, Gui_YY := Mu_YY+10
	Gui, GuiTip:Show, x%Gui_XX% y%Gui_YY%,GuiTip
    Gui, GuiTip:Show, x%Gui_XX% y%Gui_YY%,GuiTip
    SetTimer, GUISet, -1000
}
return
/*
替换动作标签（左键）
*/
GuiTipText:
ToolTip, 原文已被替换
SetTimer, Move_TT, -500
Gui, GuiTip:Destroy
Clipboard := varText
Send ^{v}
Sleep, 100
Clipboard := ""
return
/*
复制动作标签（右键）
*/
GuiTipGuiContextMenu:
ToolTip, 译文已被复制
SetTimer, Move_TT, -500
Gui, GuiTip:Destroy
Clipboard := varText
return
/*
GUI窗口管理，悬浮则保持，离开则关闭
*/
GuiSet:
MouseGetPos, mx,my
WinGetPos,  wx, wy, wd, wh,GuiTip
if((mx < wd) && (my < wh))
{
    SetTimer, GUISet, -500
}
Else
{
    Gui, GuiTip:Destroy
}
Return
/*
关闭提示
*/
Move_TT()
{
	ToolTip
	Return
}


/*
**********************************Gui Code End*********************************************
*/

/*
调用翻译和词典接口
*/
Select_Dict_Trans(mode:= "Trans",str := "hello")
{
	if(mode = "Dict")
	{
		DictChoice := Ini.Read("BasicSetting","DictChoice")
		if(DictChoice = 1)
			TheResults := Dict.Dict(str)
		if(DictChoice = 2)
			TheResults :=  Dict.Youdao(str)
		if(DictChoice = 3)
			TheResults :=  Dict.Ciba(str)
	}
	if(mode = "Trans")
	{
		TransChoice := Ini.Read("BasicSetting","TransChoice")
		if(TransChoice = 1)
			TheResults := Trans.Google(str)
		if(TransChoice = 2)
			TheResults := Trans.Youdao(str)
        if(TransChoice = 3)
			TheResults := Trans.Baidu(str)
	}
	return TheResults
}
/*
初始化配置文件
*/
ConfingInit()
{
	if !(FileExist("config.ini")) 
	{
		Ini.Write("BasicSetting","StartUp",False)
		Ini.Write("BasicSetting","DictChoice",3)
		Ini.Write("BasicSetting","TransChoice",3)
	} 
}
/*
托盘菜单初始化
*/
TrayInit()
{
	Menu, Tray, NoStandard
	Menu, Tray, Add, 设置, TraySetting
	Menu, Tray, Default, 设置
	Menu, Tray, Add, 关于, TrayAbout
    Menu, Tray, Add, 退出, TrayExit
	IniRead, OnStart, config.ini, Setting, StartUp ,0"
	if(OnStart = 1)
		Menu, Tray, Check, 开机自启
	return
}
/*
软件设置
*/
TraySetting()
{
	Global
	DictChoice := Ini.Read("BasicSetting","DictChoice")
	TransChoice := Ini.Read("BasicSetting","TransChoice")
	StartUpCheck := Ini.Read("BasicSetting","StartUp")
	Gui SettingGui:New
	Gui SettingGui:-MaximizeBox -MinimizeBox
	GUi SettingGui:Font, s10, Verdana
	Gui SettingGui:Add, GroupBox, w375 h100, 基本设置
	GUi	SettingGui:Add, Text, X20 Y35, 词典引擎
	Gui SettingGui:Add, DropDownList, X80 Y35 W70 vDictChoice AltSubmit Choose%DictChoice%, 海词|词霸|有道
	GUi	SettingGui:Add, Text,X20 Y70, 翻译引擎
	Gui SettingGui:Add, DropDownList, X80 Y70  W70 vTransChoice AltSubmit Choose%TransChoice%, 百度|谷歌|有道
	Gui SettingGui:Add, Checkbox, X200 Y35 vStartUpBtn Checked%StartUpCheck%, 开机自启动 
	Gui SettingGui:Add, GroupBox, X12 Y110 w375 h150, 高级设置
	GUi SettingGui:Add, Button, X80 Y268 W60 gSettingGuiOK, 确定
	GUi SettingGui:Add, Button, X160 Y268 W60 gSettingGuiCancel, 取消
	GUi SettingGui:Add, Button, X240 Y268 W60 gSettingGuiApply, 应用
	Gui SettingGui:Show, W400 H300 Center, 设置
	return

SettingGuiOK:
SettingGuiApply:
GUi SettingGui:Submit
Ini.Write("BasicSetting","StartUp",False)
Ini.Write("BasicSetting","DictChoice",DictChoice)
Ini.Write("BasicSetting","TransChoice",TransChoice)
SetStartup(StartUpBtn)
Ini.Write("BasicSetting","StartUp",StartUpBtn)
return

SettingGuiCancel:
Gui SettingGui:Destroy
return

}
/*
设置开机自启动
*/
SetStartup(State)
{
	StratName := StrReplace(StrReplace(A_ScriptName,".ahk"),".exe")
	if(State)
	{	RegRead, RegVar, HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Run, %StratName%
		if(ErrorLevel = 1)
		{
			RegWrite, REG_SZ, HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Run, %StratName%, %A_ScriptFullPath%
			TrayTip,,已设置开机自启！,1,1
		}
	}
	else
	{
		RegRead, RegVar, HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Run, %StratName%
		if(ErrorLevel = 0)
		{
			RegDelete, HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Run, %StratName%
			TrayTip,,已取消开机自启！,1,1
		}

	}
	return
}
/*
关于软件
*/
TrayAbout()
{
	MsgBox ,,关于,by 冷月风华！
	return
}
/*
退出软件
*/
TrayExit()
{
	ExitApp 
}

ShowWizard()
{
	if !(FileExist("config.ini")) 
	{
MsgBox ,,使用帮助,
(
	欢迎使用SmartTranslator翻译小助手！初次使用，先看一下使用方法吧！
一、选择文本后，使用默认快捷键win+c或长按右键进行查词和翻译。
二、软件查词\翻译完成后，左键文本可以用译文替换当前所选，右键文
	本可以复制译文。
)
	} 
}

```

- ② API接口处理类

```c
#include WinHttpRequests.ahk
#Include <Basic>

Class Dict
{
   Dict(wd := "hello")
   {
        DictDictionaryAPI := "https://apii.dict.cn/mini.php?q="
        DictUrl := DictDictionaryAPI . URLEncode(wd)
        TranslateRes := UrlDownloadToVar(DictUrl, "GET")	
        if TranslateRes = -1 
            return "网络异常"
        RegExMatch(TranslateRes,"(?<=id=""e"">).*?(?=</div><br><div)",res)
        return StrReplace(res, "<br>", "`r`n")
    }

   Youdao(wd := "hello")
   {
        YoudaoDictionaryAPI := "https://dict.youdao.com/suggest?num=1&doctype=json&q="
        YoudaotUrl := YoudaoDictionaryAPI . URLEncode(wd)
        TranslateRes := UrlDownloadToVar(YoudaotUrl, "GET")
        if TranslateRes = -1 
            return "网络异常"
        RegExMatch(TranslateRes,"(?<=explain"":"").*?(?="",""entry)",res)
        s := RegExMatchAll(res,"\w+\.")
        for index,each in s
        {
            if index != 1
            {
                res := StrReplace(res, each, "`r`n" . each)
            }
        }
        res := StrReplace(res, "...")
        res:= StrReplace(res, "`r`n`r`n", "`r`n")
        return res
   }
   Ciba(wd := "hello")
   {
        ;c := RegExMatch(wd, "[^\x00-\xff]+")
        CibaDictionaryAPI := "http://dict-co.iciba.com/search.php?word="
        CibaUrl := CibaDictionaryAPI . URLEncode(wd)
        TranslateRes := UrlDownloadToVar(CibaUrl, "GET")
        if TranslateRes = -1 
            return "网络异常"
        RegExMatch(TranslateRes,"(?<=<br><br>`n).*&nbsp;&nbsp;<br",res)
        res := StrReplace(res,"&nbsp;&nbsp;")
        res := StrReplace(res,"<br />","`n")
        return StrReplace(res,"<br","")
   }
}

Class Trans
{
    Google(wd := "Hello World!")
    {
        wd := StrReplace(wd, "`r"), wd := StrReplace(wd, "`n")
        sl := RegExMatch(wd, "[^\x00-\xff]+") ? "zh-CN" : "en" ;查找汉字
        tl := (sl = "zh-CN") ? "en" : "zh-CN"
        GoogleTranslatorAPI := "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t"
        GoogleUrl := GoogleTranslatorAPI . "&sl=" . sl . "&tl=" . tl . "&q=" . URLEncode(wd
        TranslateRes := UrlDownloadToVar(GoogleUrl, "GET")	
        if TranslateRes = -1 
            return "网络异常"
        TranslateRes := StrReplace(StrReplace(TranslateRes,"[[]],[[[",""), "[", "#")
        ResArray := RegExMatchAll(TranslateRes,"(?<=#"").*?(?=""`,"")")
        return  ArrayToString(ResArray," ")   
    }

    Youdao(wd := "Hello World!")
    {
        wd := StrReplace(wd, "`r"), wd := StrReplace(wd, "`n")
        YoudaoTranslatorAPI := "https://fanyi.youdao.com/translate?&doctype=json&type=AUTO&i="
        YoudaoUrl := YoudaoTranslatorAPI . URLEncode(wd)
        TranslateRes := UrlDownloadToVar(YoudaoUrl, "GET")	
        if TranslateRes = -1 
            return "网络异常"
        ResArray := RegExMatchAll(TranslateRes,"(?<=tgt"":"").*?(?=""})")
        res := ArrayToString(ResArray," ")
        return StrReplace(res, "\u201D")
    }


    Baidu(wd := "hello world!")
    {
        wd := StrReplace(wd, "`r"), wd := StrReplace(wd, "`n")
        BaiduTranslatorAPI := "https://fanyi.baidu.com/transapi?&source=txt"
        from := RegExMatch(wd, "[^\x00-\xff]+") ? "zh" : "en" ;查找汉字
        to := (from = "en") ? "zh" : "en"
        query := URLEncode(wd)
        BaiduUrl := BaiduTranslatorAPI . "&from=" . from . "&to=" . to . "&query=" . query
        TranslateRes := UrlDownloadToVar(BaiduUrl, "GET")	
        if TranslateRes = -1 
            return "网络异常"
        RegExMatch(TranslateRes,"(?<=data).*?(?=src)", JsonData)
        ResArray := RegExMatchAll(JsonData,"(?<=dst"":"").*?(?="","")")
        res := ArrayToString(ResArray," ")
        return (from = "zh") ? res : Encoding.UnicodeToCN(res)
    }

        Baidu_(wd := "hello world!")
    {
        BaiduTranslatorAPI := "https://fanyi.baidu.com/v2transapi?transtype=realtime&simple_means_flag=3&token=11354f5ab91beb1035869f9fe75e11bf&domain=common"
        from := RegExMatch(wd, "[^\x00-\xff]+") ? "zh" : "en" ;查找汉字
        to := (from = "en") ? "zh" : "en"
        query := URLEncode(wd)
        Sign := RunJS.BaiduJS(wd)
        BaiduUrl := BaiduTranslatorAPI . "&from=" . from . "&to=" . to . "&query=" . query . "&sign=" . Sign
        TranslateRes := UrlDownloadToVar(BaiduUrl, "GET")	
        if TranslateRes = -1
            return "网络异常"
        RegExMatch(TranslateRes,"(?<=data).*?(?=from)", JsonData)
        ResArray := RegExMatchAll(JsonData,"(?<=dst"":"").*?(?="","")")
        res := ArrayToString(ResArray," ")
        return (from = "zh") ? res : Encoding.UnicodeToUTF8(res)
    }

}
```

- ③网页请求类

```c
/*
简单数组转字符串
*/
ArrayToString(array,Delimiters := ",")
{
    for index,each in array
    {
        if(index = array.Count())
        {
            res .= each
            Continue
        }
        res .= each . Delimiters
    }
    return res
}
/*
log日志函数
*/
PrintLog(logstr)
{
        FileAppend, %logstr%, *, UTF-8-RAW
}
/*
url参数配置
*/
FormatData(Array)
{   
    var := True
    data := ""
    if IsObject(Array)
    {
        for each,value in Array
        {
            Data .= "&" . each . "=" . value
        }
        return data
    }
    return data
}
/*
下载网页内容到变量
https://docs.microsoft.com/zh-cn/windows/win32/winhttp/iwinhttprequest-interface
*/
UrlDownloadToVar(url,method := "GET", touch := 0)	;网页爬取
{
    UA := "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36"
    Cookie := "BIDUPSID=810580A9A87034829F016DC79C4FAE90; PSTM=1629958394; BAIDUID=B83FE1AF5CECBA53EA2FF0545752EEBF:FG=1; __yjs_duid=1_eb6e98ca526fec92ed2a9ab430a438521629958877719; REALTIME_TRANS_SWITCH=1; FANYI_WORD_SWITCH=1; HISTORY_SWITCH=1; SOUND_SPD_SWITCH=1; SOUND_PREFER_SWITCH=1; BDUSS=hzMHR4bGNRelN4NTZlUmhhM3RHeEFYWERiQlBpWml2WTk4NGI3MzR2cGN4SEJoSVFBQUFBJCQAAAAAAAAAAAEAAABlG~zCaW5vdmlzaW9uNwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFw3SWFcN0lhT3; BDUSS_BFESS=hzMHR4bGNRelN4NTZlUmhhM3RHeEFYWERiQlBpWml2WTk4NGI3MzR2cGN4SEJoSVFBQUFBJCQAAAAAAAAAAAEAAABlG~zCaW5vdmlzaW9uNwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFw3SWFcN0lhT3; BDORZ=FFFB88E999055A3F8A630C64834BD6D0; H_PS_PSSID=31660_26350; delPer=0; BAIDUID_BFESS=B83FE1AF5CECBA53EA2FF0545752EEBF:FG=1; BDRCVFR[NPt2Vg_wYt_]=mk3SLVN4HKm; PSINO=5; BA_HECTOR=8k8g002g850g01ahpj1gpn0p50r; Hm_lvt_64ecd82404c51e03dc91cb9e8c025574=1637509857,1637511433,1637576328,1637581609; Hm_lpvt_64ecd82404c51e03dc91cb9e8c025574=1637581609"
    whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")
    Try 
    {
        whr.Open(method, url, true)
        whr.SetRequestHeader("User-Agent",UA)
        whr.SetRequestHeader("Cookie",Cookie)
        whr.Send()
        a := whr.WaitForResponse(1)
        if a = 0
        {
           return -1
        }
        if (touch)
        {
            html := whr.ResponseText
            FileEncoding, UTF-8-RAW
            file := FileOpen("HTML.html", "w")
            file.Write(html)
            file.Close()
        }
        return whr.ResponseText
    }
    Catch e
    {
        return -1
    }
    
}
/*
正则匹配进阶版
*/
RegExMatchAll(Haystack, NeedleRegEx)
{
	res := Array()
	StartPos := 1
	while(FoundPos := RegExMatch(Haystack,NeedleRegEx,s,StartPos))
	{
		StartPos := FoundPos + StrLen(s)
		res.Push(s)
	}
	return res
}
/*
URLEncode函数
by dbgba @ https://www.autoahk.com/archives/35086
https://gitee.com/barbarla/AHK_Lib/blob/master/Encode.ahk
*/
URLEncode(str, encoding := "UTF-8") 
{
    VarSetCapacity(var, StrPut(str, encoding))
    StrPut(str, &var, encoding)
    While code := NumGet(Var, A_Index - 1, "UChar") 
    {
        bool := (code > 0x7F || code < 0x30 || code = 0x3D)
        UrlStr .= bool ? "%" . Format("{:02X}", code) : Chr(code)
    } Return UrlStr
}

/*
Hash() v0.37 by SKAN on D444/D445 @ tiny.cc/hashit
https://www.autohotkey.com/boards/viewtopic.php?f=6&t=88975&p=392052&hilit=tiny.cc%2Fhashit#p392052
哈希校验函数
*/
Hash(Options, ByRef Var, nBytes:="",lowe := true)
{ 
    Local
    HA := {"ALG":"SHA256","BAS":0, "UPP":1, "ENC":"UTF-8"}
    Loop, Parse, % Format("{:U}", Options), %A_Space%, +
        A := StrSplit(A_LoopField, ":", "+"), HA[ SubStr(A[1], 1, 3) ] := A[2]

    HA.X := ( HA.ENC="UTF-16" ? 2 : 1)
    OK1 := { "SHA1":1, "SHA256":1, "SHA384":1, "SHA512":1, "MD2":1, "MD4":1, "MD5":1 }[ HA.ALG ]
    OK2 := { "CP0":1, "UTF-8":1, "UTF-16":1}[ HA.ENC ]
    NaN := ( StrLen(nBytes) And (nBytes != Round(nBytes)) ), lVar := StrLen(Var)
    pNum := ( lVar And [var].GetCapacity(1)="" And (Var = Abs(Round(Var))) ), nVar := VarSetCapacity(Var)

    If ( OK1="" Or OK2="" Or NaN=1 Or lVar<1 Or (pNum=1 And nBytes<1) Or (pNum=0 And nVar<nBytes))
        Return ( 0, ErrorLevel := OK1="" ? "Algorithm not known.`n=> MD2 MD4 MD5 SHA1 SHA256 SHA384 SHA512`nDefault: SHA256"
        : OK2="" ? "Codepage incorrect.`n=> CP0 UTF-16 UTF-8`nDefault: UTF-8"
        : NaN=1 ? "nBytes in incorrect format"
        : lVar<1 ? "Var is empty. Nothing to hash."
        : (pNum=1 And nBytes<1) ? "Pointer requires nBytes greater than 0."
    : (pNum=0 And nVar<nBytes) ? "Var's capacity is lesser than nBytes." : "" )

    hBcrypt := DllCall("Kernel32.dll\LoadLibrary", "Str","Bcrypt.dll", "Ptr")
    DllCall("Bcrypt.dll\BCryptOpenAlgorithmProvider", "PtrP",hAlg:=0, "WStr",HA.ALG, "Ptr",0, "Int",0, "UInt")
    DllCall("Bcrypt.dll\BCryptCreateHash", "Ptr",hAlg, "PtrP",hHash:=0, "Ptr", 0, "Int", 0, "Ptr",0, "Int",0, "Int", 0)

    nLen := 0, FileLen := File := rBytes := sStr := nErr := ""
    If ( nBytes!="" And (pBuf:=pNum ? Var+0 : &Var) )
    {
        If ( nBytes<=0 )
            nBytes := StrPut(Var, HA.ENC)
        , VarSetCapacity(sStr, nBytes * HA.X)
        , nBytes := ( StrPut(Var, pBuf := &sStr, nBytes, HA.ENC) - 1 ) * HA.X
        nErr := DllCall("Bcrypt.dll\BCryptHashData", "Ptr",hHash, "Ptr",pBuf, "Int",nBytes, "Int", 0, "UInt")
    } Else {
        File := FileOpen(Var, "r -rwd")
        If ( (FileLen := File.Length) And VarSetCapacity(Bin, 65536) )
            Loop
            If ( rBytes := File.RawRead(&Bin, 65536) )
            nErr := DllCall("Bcrypt.dll\BCryptHashData", "Ptr",hHash, "Ptr",&Bin, "Int",rBytes, "Int", 0, "Uint")
        Until ( nErr Or File.AtEOF Or !rBytes )
        File := ( FileLen="" ? 0 : File.Close() )
    }

    DllCall("Bcrypt.dll\BCryptGetProperty", "Ptr",hAlg, "WStr", "HashDigestLength", "UIntP",nLen, "Int",4, "PtrP",0, "Int",0)
    VarSetCapacity(Hash, nLen)
    DllCall("Bcrypt.dll\BCryptFinishHash", "Ptr",hHash, "Ptr",&Hash, "Int",nLen, "Int", 0)
    DllCall("Bcrypt.dll\BCryptDestroyHash", "Ptr",hHash)
    DllCall("Bcrypt.dll\BCryptCloseAlgorithmProvider", "Ptr",hAlg, "Int",0)
    DllCall("Kernel32.dll\FreeLibrary", "Ptr",hBCrypt)

    If ( nErr=0 )
        VarSetCapacity(sStr, 260, 0), nFlags := HA.BAS ? 0x40000001 : 0x4000000C
    , DllCall("Crypt32\CryptBinaryToString", "Ptr",&Hash, "Int",nLen, "Int",nFlags, "Str",sStr, "UIntP",130)
    , sStr := ( nFlags=0x4000000C And HA.UPP ? Format("{:U}", sStr) : sStr )
    if lowe
    {
        StringLower, md5, sStr
        return md5
    }
    Return ( sStr, ErrorLevel := File=0 ? ( FileExist(Var) ? "Open file error. File in use." : "File does not exist." )
        : FileLen=0 ? "Zero byte file. Nothing to hash."
        : (FileLen & rBytes=0) ? "Read file error."
        : nErr ? Format("Bcrypt error. 0x{:08X}", nErr)
    : nErr="" ? "Unknown error." : "" )
}

/*
进制转换函数
ToBase / FromBase by Lazslo @ http://www.autohotkey.com/forum/post-276241.html#276241
*/
ToBase(n,b){
    return (n < b ? "" : ToBase(n//b,b)) . ((d:=Mod(n,b)) < 10 ? d : Chr(d+55))
}

```

- ④附加操作类

```c
;https://github.com/ahkscript/libcrypt.ahk
;基础类
Class Basic
{
	LIB(Name := "Gitte")
	{
		if (Name = "Gitte")
		{
			run https://gitee.com/barbarla/AHK_Lib/tree/master
		}
	}
}
;用于调试的打印输出
Class Console 
{
	Log(str := "-1", mode := "stdout"){
		if(mode = "Stdout")
		{
			FileAppend, %str%, *, UTF-8-RAW
		}
		else if(mode = "Stderr")
		{
			FileAppend, %str%, **, UTF-8-RAW
		}
		else if(mode = "File")
		{
			FileAppend, %str% . `n, %A_ScriptDir%\ConsoleLog.log, UTF-8-RAW
		}
		else if(mode = "Enter")
		{
			FileAppend, %str%`n, *, UTF-8-RAW
		}
		else
		{
			Msgbox,, Console.Log, Parameter error!
		}
		return
	}

}


;简化ini文件的读写操作
Class Ini
{
	Write(Section, Key, Value, fname := "config.ini")
	{
		IniWrite, %Value%, %fname%, %Section%, %Key%
		return this
	}
	
	Read(Section, Key,  fname := "config.ini")
	{
		IniRead, IniVar, %fname%, %Section%, %Key%
		return IniVar
	}
	
	Delete(Section, Key,  fname := "config.ini")
	{
		if key is space
			IniDelete, %fname%, %Section%
		else
			IniDelete, %fname%, %Section%, %Key%
		return
	}
}


;哈希计算
;https://www.autohotkey.com/boards/viewtopic.php?f=6&t=88975
Class Hash
{
	MD5(ByRef Var)
	{
		return this.Hash("alg:MD5",Var,-1)
	}
	
	Hash(Options, ByRef Var, nBytes:="") 
	{
		Local
		HA := {"ALG":"SHA256","BAS":0, "UPP":1, "ENC":"UTF-8"}
		Loop, Parse, % Format("{:U}", Options), %A_Space%, +
			A := StrSplit(A_LoopField, ":", "+"), HA[ SubStr(A[1], 1, 3) ] := A[2]

		HA.X := ( HA.ENC="UTF-16" ? 2 : 1)
		OK1  := { "SHA1":1, "SHA256":1, "SHA384":1, "SHA512":1, "MD2":1, "MD4":1, "MD5":1 }[ HA.ALG ]
		OK2  := { "CP0":1, "UTF-8":1, "UTF-16":1}[ HA.ENC ]
		NaN  := ( StrLen(nBytes) And (nBytes != Round(nBytes)) ),                    lVar := StrLen(Var)
		pNum := ( lVar And [var].GetCapacity(1)="" And (Var = Abs(Round(Var))) ),    nVar := VarSetCapacity(Var)

		If ( OK1="" Or OK2="" Or NaN=1 Or lVar<1 Or (pNum=1 And nBytes<1) Or (pNum=0 And nVar<nBytes))
			Return ( 0, ErrorLevel  := OK1="" ? "Algorithm not known.`n=> MD2 MD4 MD5 SHA1 SHA256 SHA384 SHA512`nDefault: SHA256"
									:  OK2="" ? "Codepage incorrect.`n=> CP0 UTF-16 UTF-8`nDefault: UTF-8"
									:  NaN=1  ? "nBytes in incorrect format"
									:  lVar<1 ? "Var is empty. Nothing to hash."
									: (pNum=1 And nBytes<1) ? "Pointer requires nBytes greater than 0."
									: (pNum=0 And nVar<nBytes) ? "Var's capacity is lesser than nBytes." : "" )

		hBcrypt := DllCall("Kernel32.dll\LoadLibrary", "Str","Bcrypt.dll", "Ptr")
		DllCall("Bcrypt.dll\BCryptOpenAlgorithmProvider", "PtrP",hAlg:=0, "WStr",HA.ALG, "Ptr",0, "Int",0, "UInt")
		DllCall("Bcrypt.dll\BCryptCreateHash", "Ptr",hAlg, "PtrP",hHash:=0, "Ptr", 0, "Int", 0, "Ptr",0, "Int",0, "Int", 0)

		nLen := 0, FileLen := File := rBytes := sStr := nErr := ""
		If ( nBytes!="" And (pBuf:=pNum ? Var+0 : &Var) )
		{
			If ( nBytes<=0  )
					nBytes := StrPut(Var, HA.ENC)
				  , VarSetCapacity(sStr, nBytes * HA.X)
				  , nBytes := ( StrPut(Var, pBuf := &sStr, nBytes, HA.ENC) - 1 ) * HA.X
			   nErr := DllCall("Bcrypt.dll\BCryptHashData", "Ptr",hHash, "Ptr",pBuf, "Int",nBytes, "Int", 0, "UInt")
		} 
		Else 
		{
			File := FileOpen(Var, "r -rwd")
			If  ( (FileLen := File.Length) And VarSetCapacity(Bin, 65536) )
				 Loop
				 If ( rBytes := File.RawRead(&Bin, 65536) )
					nErr   := DllCall("Bcrypt.dll\BCryptHashData", "Ptr",hHash, "Ptr",&Bin, "Int",rBytes, "Int", 0, "Uint")
				 Until ( nErr Or File.AtEOF Or !rBytes )
			File := ( FileLen="" ? 0 : File.Close() )
			 }

		DllCall("Bcrypt.dll\BCryptGetProperty", "Ptr",hAlg, "WStr", "HashDigestLength", "UIntP",nLen, "Int",4, "PtrP",0, "Int",0)
		VarSetCapacity(Hash, nLen)
		DllCall("Bcrypt.dll\BCryptFinishHash", "Ptr",hHash, "Ptr",&Hash, "Int",nLen, "Int", 0)
		DllCall("Bcrypt.dll\BCryptDestroyHash", "Ptr",hHash)
		DllCall("Bcrypt.dll\BCryptCloseAlgorithmProvider", "Ptr",hAlg, "Int",0)
		DllCall("Kernel32.dll\FreeLibrary", "Ptr",hBCrypt)

		If ( nErr=0 )
		 VarSetCapacity(sStr, 260, 0),  nFlags := HA.BAS ? 0x40000001 : 0x4000000C
	   , DllCall("Crypt32\CryptBinaryToString", "Ptr",&Hash, "Int",nLen, "Int",nFlags, "Str",sStr, "UIntP",130)
	   , sStr := ( nFlags=0x4000000C And HA.UPP ? Format("{:U}", sStr) : sStr )

		Return ( sStr, ErrorLevel := File=0    ? ( FileExist(Var) ? "Open file error. File in use." : "File does not exist." )
							   : FileLen=0 ? "Zero byte file. Nothing to hash."
					: (FileLen & rBytes=0) ? "Read file error."
									: nErr ? Format("Bcrypt error. 0x{:08X}", nErr)
								 : nErr="" ? "Unknown error." : "" )
	}
}

;自用正则表达式
;https://www.freesion.com/article/4025847450/
class RegExp
{
	Match(Haystack, NeedleRegEx)
	{
		MatchRes := []
		FoundPos := 1
		Match := {Len: {0: 0}}
		SubMode := "O)"
		NeedleRegEx := SubMode . NeedleRegEx
		While (FoundPos := RegExMatch(Haystack, NeedleRegEx, Match, FoundPos + Match.Len[0]))
		{
			MatchRes.Push(Match.Value(0))
		}
		return MatchRes
	}
	
	Replace(Haystack, NeedleRegEx, Replacement := "", Limit := -1)
	{
		RegExReplace(Haystack, NeedleRegEx, Replacement, Limit)
	}
	
	MatchChinese(Haystack)
	{
		MatchRes := []
		FoundPos := 1
		Match := {Len: {0: 0}}
		NeedleRegEx := "O)[^\x00-\xff]+"
		While (FoundPos := RegExMatch(Haystack, NeedleRegEx, Match, FoundPos + Match.Len[0]))
		{
			MatchRes.Push(Match.Value(0))
		}
		return MatchRes
	}
	
	MatchWord(Haystack)
	{
		MatchRes := []
		FoundPos := 1
		Match := {Len: {0: 0}}
		NeedleRegEx := "O)[a-zA-Z]+"
		While (FoundPos := RegExMatch(Haystack, NeedleRegEx, Match, FoundPos + Match.Len[0]))
		{
			MatchRes.Push(Match.Value(0))
		}
		return MatchRes
	}
}

Class Encoding
{
	;https://www.autohotkey.com/boards/viewtopic.php?f=28&t=3897
	;中文转Unicode
	CNToUnicode(str)
	{
		OldFormat := A_FormatInteger
		SetFormat, Integer, Hex
		Loop, Parse, str
			res .= "\u" . SubStr( Asc(A_LoopField), 3 )
		SetFormat, Integer, %OldFormat%
		Return res
	}
	;https://www.autohotkey.com/boards/viewtopic.php?f=28&t=3897
	;Unicode转中文
	UnicodeToCN(str)
	{
		Loop, Parse, str, u, \
			res .= Chr("0x" . A_LoopField)
		return res
	}

	/*
	URLEncode函数
	by dbgba @ https://www.autoahk.com/archives/35086
	https://gitee.com/barbarla/AHK_Lib/blob/master/Encode.ahk
	*/
	URLEncode(str, encoding := "UTF-8") 
	{
		VarSetCapacity(var, StrPut(str, encoding))
		StrPut(str, &var, encoding)
		While code := NumGet(Var, A_Index - 1, "UChar") 
		{
			bool := (code > 0x7F || code < 0x30 || code = 0x3D)
			UrlStr .= bool ? "%" . Format("{:02X}", code) : Chr(code)
		} Return UrlStr
	}
}

Class WinHttpRequests
{
	static DefaultHeader :=	{"User-Agent" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36"
				 ,"Cookie" : "BIDUPSID=810580A9A87034829F016DC79C4FAE90; PSTM=1629958394; BAIDUID=B83FE1AF5CECBA53EA2FF0545752EEBF:FG=1; __yjs_duid=1_eb6e98ca526fec92ed2a9ab430a438521629958877719; REALTIME_TRANS_SWITCH=1; FANYI_WORD_SWITCH=1; HISTORY_SWITCH=1; SOUND_SPD_SWITCH=1; SOUND_PREFER_SWITCH=1; BDUSS=hzMHR4bGNRelN4NTZlUmhhM3RHeEFYWERiQlBpWml2WTk4NGI3MzR2cGN4SEJoSVFBQUFBJCQAAAAAAAAAAAEAAABlG~zCaW5vdmlzaW9uNwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFw3SWFcN0lhT3; BDUSS_BFESS=hzMHR4bGNRelN4NTZlUmhhM3RHeEFYWERiQlBpWml2WTk4NGI3MzR2cGN4SEJoSVFBQUFBJCQAAAAAAAAAAAEAAABlG~zCaW5vdmlzaW9uNwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFw3SWFcN0lhT3; BDORZ=FFFB88E999055A3F8A630C64834BD6D0; H_PS_PSSID=31660_26350; delPer=0; BAIDUID_BFESS=B83FE1AF5CECBA53EA2FF0545752EEBF:FG=1; BDRCVFR[NPt2Vg_wYt_]=mk3SLVN4HKm; PSINO=5; BA_HECTOR=8k8g002g850g01ahpj1gpn0p50r; Hm_lvt_64ecd82404c51e03dc91cb9e8c025574=1637509857,1637511433,1637576328,1637581609; Hm_lpvt_64ecd82404c51e03dc91cb9e8c025574=1637581609"}
	static HTTPREQUEST_PROXYSETTING_PROXY := 2
	static FullUrl := "https://www.autohotkey.com/boards"
	Post(Url := "https://www.autohotkey.com/boards", FormData := "", Headers := "", SaveHtml := "", Proxy := "", Asyns := True, ResponseTimeout := 1)
	{
		Try
		{
			whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")
			for k,v in FormData
				Url := Url . "&" . k . "=" . v
			this.FullUrl := Url
			whr.Open("POST", Url, Asyns)
			if (Headers = "")
			{
				for k,v in this.DefaultHeader
					whr.SetRequestHeader(k,v)
			}
			else
			{
				for k,v in Headers
					whr.SetRequestHeader(k,v)
			}
			if (Proxy != "")
				whr.SetProxy(this.HTTPREQUEST_PROXYSETTING_PROXY,Proxy)
			whr.Send()
			State := whr.WaitForResponse(ResponseTimeout)	
			if (State = 0)
				return -1
			if (SaveHtml != "")
			{
				Result := whr.ResponseText
				FileEncoding, UTF-8-RAW
				SaveHtml := SaveHtml . ".html"
				file := FileOpen(SaveHtml, "w")
				file.Write(Result)
				file.Close()
			}
			return whr.ResponseText
		}
		catch err
		{
			Throw, err
		}
	}
	
	Get(Url := "https://www.autohotkey.com/boards", FormData := "", Headers := "", SaveHtml := "", Proxy := "", Asyns := True, ResponseTimeout := 1)
	{
		Try
		{
			whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")
			for k,v in FormData
				Url := Url . "&" . k . "=" . v
			this.FullUrl := Url
			whr.Open("Get", Url, Asyns)
			if (Headers = "")
			{
				for k,v in this.DefaultHeader
					whr.SetRequestHeader(k,v)
			}
			else
			{
				for k,v in Headers
					whr.SetRequestHeader(k,v)
			}
			if (Proxy != "")
				whr.SetProxy(this.HTTPREQUEST_PROXYSETTING_PROXY,Proxy)
			whr.Send()
			State := whr.WaitForResponse(ResponseTimeout)	
			if (State = 0)
				return -1
			if (SaveHtml != "")
			{
				Result := whr.ResponseText
				FileEncoding, UTF-8-RAW
				SaveHtml := SaveHtml . ".html"
				file := FileOpen(SaveHtml, "w")
				file.Write(Result)
				file.Close()
			}
			return whr.ResponseText
		}
		catch err
		{
			Throw, err
		}
	}
	
	GetCurrentFullUrl()
	{
		return this.FullUrl
	}
}
```

#### 6.软件及代码下载

蓝奏云： [点击下载](https://lengyuefenghua.lanzoui.com/b0110ub4d%20%E5%AF%86%E7%A0%81:0000) 密码：0000
Github: 待添加