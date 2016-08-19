Dynamsoft.WebTwainEnv.RegisterEvent('OnWebTwainReady', Dynamsoft_OnReady); // Register OnWebTwainReady event. This event fires as soon as Dynamic Web TWAIN is initialized and ready to be used

var DWObject, blankField = "", extrFieldsCount = 0, upload_returnSth = true;
var CurrentPathName = unescape(location.pathname);
var CurrentPath = CurrentPathName.substring(0, CurrentPathName.lastIndexOf("/") + 1);
var strHTTPServer = location.hostname;
var strActionPage;

function downloadPDFR() {
    Dynamsoft__OnclickCloseInstallEx();
    DWObject.Addon.PDF.Download(
        CurrentPath + '/Resources/addon/Pdf.zip',
        function () {/*console.log('PDF dll is installed');*/
        },
        function (errorCode, errorString) {
            console.log(errorString);
        }
    );
}

function Dynamsoft_OnReady() {
    DWObject = Dynamsoft.WebTwainEnv.GetWebTwain('dwtcontrolContainer'); // Get the Dynamic Web TWAIN object that is embeded in the div with id 'dwtcontrolContainer'
    if (DWObject) {
        DWObject.RegisterEvent('OnImageAreaSelected', Dynamsoft_OnImageAreaSelected);
        DWObject.RegisterEvent('OnImageAreaDeSelected', Dynamsoft_OnImageAreaDeSelected);
        /*
        * Make sure the PDF Rasterizer and OCR add-on are already installedsample
        */
        if (!Dynamsoft.Lib.env.bMac) {
            var localPDFRVersion = DWObject._innerFun('GetAddOnVersion', '["pdf"]');
            if (Dynamsoft.Lib.env.bIE) {
                localPDFRVersion = DWObject.getSWebTwain().GetAddonVersion("pdf");
            }
            if (localPDFRVersion != Dynamsoft.PdfVersion) {
                var ObjString = [];
                ObjString.push('<div class="p15" id="pdfr-install-dlg">');
                ObjString.push('The <strong>PDF Rasterizer</strong> is not installed on this PC<br />Please click the button below to get it installed');
                ObjString.push('<p class="tc mt15 mb15"><input type="button" value="Install PDF Rasterizer" onclick="downloadPDFR();" class="btn lgBtn bgBlue" /><hr></p>');
                ObjString.push('<i><strong>The installation is a one-time process</strong> <br />It might take some time depending on your network.</i>');
                ObjString.push('</div>');
                Dynamsoft.WebTwainEnv.ShowDialog(400, 310, ObjString.join(''));
            }
            else {
                /**/
            }
        }
    }
}

function AcquireImage() {
    if (DWObject) {
        var bSelected = DWObject.SelectSource();
        if (bSelected) {
            var OnAcquireImageSuccess, OnAcquireImageFailure;
            OnAcquireImageSuccess = OnAcquireImageFailure = function () {
                DWObject.CloseSource();
            };

            DWObject.OpenSource();
            DWObject.IfDisableSourceAfterAcquire = true;  //Scanner source will be disabled/closed automatically after the scan.
            DWObject.AcquireImage(OnAcquireImageSuccess, OnAcquireImageFailure);
        }
    }
}

function LoadImages() {
    if (DWObject) {
        var nCount = 0, nCountLoaded = 0, aryFilePaths = [];
        DWObject.IfShowFileDialog = false;
        function ds_load_pdfa(bSave, filesCount, index, path, filename) {
            nCount = filesCount;
            if (nCount == -1) {
                Dynamsoft.Lib.detect.hideMask();
                return;
            }
            var filePath = path + "\\" + filename, _oFile = {};
            _oFile._filePath = filePath;
            _oFile._fileIsPDF = false;
            if ((filename.substr(filename.lastIndexOf('.') + 1)).toLowerCase() == 'pdf') {
                _oFile._fileIsPDF = true;
            }
            aryFilePaths.push(_oFile);
            if (aryFilePaths.length == nCount) {
                var i = 0;
                function loadFileOneByOne() {
                    if (aryFilePaths[i]._fileIsPDF) {
                        DWObject.Addon.PDF.SetResolution(200);
                        DWObject.Addon.PDF.SetConvertMode(EnumDWT_ConverMode.CM_RENDERALL);
                    }
                    DWObject.LoadImage(aryFilePaths[i]._filePath,
                        function () {
                            console.log('Load Image:' + aryFilePaths[i]._filePath + ' -- successful');
                            i++;
                            if (i != nCount)
                                loadFileOneByOne();
                        },
                        function (errorCode, errorString) {
                            alert('Load Image:' + aryFilePaths[i]._filePath + errorString);
                        }
                    );
                }
                loadFileOneByOne();
            }
        }
        DWObject.RegisterEvent('OnGetFilePath', ds_load_pdfa);
        DWObject.RegisterEvent('OnPostLoad', function (path, name, type) {
            nCountLoaded++;
            console.log('load' + nCountLoaded);
            if (nCountLoaded == nCount) {
                DWObject.UnregisterEvent('OnGetFilePath', ds_load_pdfa);
                Dynamsoft.Lib.detect.hideMask();
            }
        });
        DWObject.ShowFileDialog(false, "BMP, JPG, PNG, PDF and TIF | *.bmp;*.jpg;*.png;*.pdf;*.tif;*.tiff", 0, "", "", true, true, 0)
        Dynamsoft.Lib.detect.showMask();
    }
}
function OnHttpUploadSuccess() {
    console.log('upload successful');
}

function OnHttpServerReturnedSomething(errorCode, errorString, sHttpResponse) {
    //console.log(errorString);
    var textFromServer = sHttpResponse;
    _printUploadedFiles(textFromServer);
}

function _printUploadedFiles(info) {
    document.getElementById('resultWrap').innerHTML += info;
}

function upload_preparation() {
    strActionPage = CurrentPath + 'ReadBarcodes.aspx';
    DWObject.IfSSL = DynamLib.detect.ssl;
    var _strPort = location.port == "" ? 80 : location.port;
    if (DynamLib.detect.ssl == true)
        _strPort = location.port == "" ? 443 : location.port;
    DWObject.HTTPPort = _strPort;
}
function UploadImage() {
    if (DWObject.HowManyImagesInBuffer == 0)
        return;

    var Digital = new Date();
    var uploadfilename = Digital.getMilliseconds(); // Uses milliseconds according to local time as the file name
    upload_preparation();
    //Upload image(s) to server side for barcode reading
    DWObject.SetHTTPFormField('left', ileft);
    DWObject.SetHTTPFormField('top', itop);
    DWObject.SetHTTPFormField('right', iright);
    DWObject.SetHTTPFormField('bottom', ibottom);
    DWObject.HTTPUploadAllThroughPostAsMultiPageTIFF(strHTTPServer, strActionPage, uploadfilename + ".tif", OnHttpUploadSuccess, OnHttpServerReturnedSomething);
}

var ileft = itop = iright = ibottom = 0;

function Dynamsoft_OnImageAreaSelected(sImageIndex, left, top, right, bottom) {
    if (DWObject) {
        ileft = Math.round(left);
        itop = Math.round(top);
        iright = Math.round(right);
        ibottom = Math.round(bottom);
        console.log("Left: " + ileft + ",Right: " + iright + ",Top: " + itop + ",Bottom: " + ibottom);
    }
}

function Dynamsoft_OnImageAreaDeSelected() {
    ileft = itop = iright = ibottom = 0;
}

function Reset() {
    if (DWObject) {
        DWObject.RemoveAllImages();
        document.getElementById('resultWrap').innerHTML = '';
        ileft = itop = iright = ibottom = 0;
    }
}