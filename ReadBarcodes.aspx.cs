using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Dynamsoft.Barcode;
using System.Drawing;

public partial class ReadBarcodes : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        try
        {
            /***********************Save Image on Server**********************/
            String strImageName;
            String strleft = HttpContext.Current.Request["left"];
            String strtop = HttpContext.Current.Request["top"];
            String strright = HttpContext.Current.Request["right"];
            String strbottom = HttpContext.Current.Request["bottom"];
            HttpFileCollection files = HttpContext.Current.Request.Files;
            HttpPostedFile uploadfile = files["RemoteFile"];
            strImageName = uploadfile.FileName;
            Rectangle rect;
            strImageName = Server.MapPath("/") + "\\UploadedImages\\" + uploadfile.FileName;
            uploadfile.SaveAs(strImageName);

            /***********************Read Barcode Image**********************/
            BarcodeReader reader = new BarcodeReader();
            ReaderOptions options = new ReaderOptions();
            options.MaxBarcodesToReadPerPage = 100;
            //options.BarcodeFormats = (BarcodeFormat.CODE_39 | BarcodeFormat.CODE_128);
            options.BarcodeFormats = (BarcodeFormat.OneD | BarcodeFormat.QR_CODE | BarcodeFormat.PDF417 | BarcodeFormat.DATAMATRIX);

            reader.ReaderOptions = options;
            reader.LicenseKeys = "310711B75A4AD34CB4763957D423F99C";

            BarcodeResult[] results = null;
            if (System.Int32.Parse(strbottom) > 0)
            {
                rect = new Rectangle(System.Int32.Parse(strleft), System.Int32.Parse(strtop), System.Int32.Parse(strright) - System.Int32.Parse(strleft), System.Int32.Parse(strbottom) - System.Int32.Parse(strtop));
                results = reader.DecodeFileRect(strImageName, rect);
            }
            else
                results = reader.DecodeFile(strImageName);

            strleft = ""; strtop = ""; strright = ""; strbottom = "";

            if (results == null)
            {
                Response.Write("No Barcode Detected.<br />");
                return;
            }

            /**********************Return Barcode Rsults*********************/
            String strResults = "Total barcode(s) found: " + results.Length.ToString() + "<br />";
            for (int i = 0; i < results.Length; ++i)
            {
                BarcodeResult barcode = results[i];
                strResults += "<strong>Barcode " + (i + 1).ToString() + ":</strong><br />On Page <strong>";
                strResults += barcode.PageNumber.ToString() + "</strong><br />Type: ";
                strResults += barcode.BarcodeFormat.ToString() + "<br />Text: <span style='color:#fe8e14'>";
                strResults += barcode.BarcodeText + "</span><br /><br />";
            }
            Response.Write(strResults);
        }
        catch (Exception ex)
        {
            Response.Write(ex.ToString());
        }
    }
}