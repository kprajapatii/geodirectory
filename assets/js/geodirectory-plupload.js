jQuery.fn.exists = function() {
    return jQuery(this).length > 0;
}

jQuery(document).ready(function($) {
    if ($(".plupload-upload-uic").exists()) {
        var pconfig = false;
        var msgErr = '';
        var post_id = '';
        // set the post id
        if (jQuery("#geodirectory-add-post input[name='ID']").length) {
            post_id = jQuery("#geodirectory-add-post input[name='ID']").val(); // frontend
        } else {
            post_id = jQuery("#post input[name='post_ID']").val(); // backend
        }


        $(".plupload-upload-uic").each(function() {
            var $this = $(this);
            var id1 = $this.attr("id");
            var imgId = id1.replace("plupload-upload-ui", "");

            plu_show_thumbs(imgId);

            pconfig = JSON.parse(geodir_plupload_params.base_plupload_config);
            pconfig["browse_button"] = imgId + pconfig["browse_button"];
            pconfig["container"] = imgId + pconfig["container"];
            if (jQuery('#' + imgId + 'dropbox').length) {
                pconfig["drop_element"] = imgId + 'dropbox';
            } // only add drop area if there is one
            pconfig["file_data_name"] = imgId + pconfig["file_data_name"];
            pconfig["multipart_params"]["imgid"] = imgId;
            pconfig["multipart_params"]["post_id"] = post_id;
            //pconfig["multipart_params"]["_ajax_nonce"] = $this.find(".ajaxnonceplu").attr("id").replace("ajaxnonceplu", "");

            if ($this.hasClass("plupload-upload-uic-multiple")) {
                pconfig["multi_selection"] = true;
            }

            var allowed_exts = jQuery('#' + imgId + '_allowed_types').val();
            allowed_exts = allowed_exts && allowed_exts != '' ? allowed_exts : '';
            if (imgId == 'post_images' && typeof geodir_params.gd_allowed_img_types != 'undefined' && geodir_params.gd_allowed_img_types != '') {
                allowed_exts = geodir_params.gd_allowed_img_types;
            }

            if (allowed_exts && allowed_exts != '') {
                var txt_all_files = (typeof geodir_params.txt_all_files != 'undefined' && geodir_params.txt_all_files != '') ? geodir_params.txt_all_files : 'Allowed files';
                pconfig['filters'] = [{
                    'title': txt_all_files,
                    'extensions': allowed_exts
                }];
            }

            var uploader = new plupload.Uploader(pconfig);
            uploader.bind('Init', function(up) {
                //alert(1);
            });

            uploader.bind('Init', function(up, params) {
                if (uploader.features.dragdrop) {
                    var drop_id = imgId + 'dropbox';
                    var target = jQuery('#' + drop_id);

                    target.on("dragenter", function(event) {
                        target.addClass("dragover");
                    });

                    target.on("dragleave", function(event) {
                        target.removeClass("dragover");
                    });

                    target.on("drop", function() {
                        target.removeClass("dragover");
                    });
                }

                /* Fix: iPhone(iOS Safari) don't triggers upload on hidden element */
                if ($this.find('.moxie-shim').length) {
                    $this.find('.moxie-shim').css({'position':'initial'});
                }
            });

            uploader.init();

            /* Fires when a file is to be uploaded by the runtime. */
            uploader.bind('UploadFile', function(up, file) {
                if (imgId == 'post_images') {
                    window.geodirUploading = true;
                }
            });

            /* Fires when all files in a queue are uploaded. */
            uploader.bind('UploadComplete', function(up, files) {
                if (imgId == 'post_images') {
                    window.geodirUploading = false;
                }
            });

            uploader.bind('Error', function(up, files) {
                if (imgId == 'post_images') {
                    window.geodirUploading = false;
                }
                if (files.code == -600) {
                    jQuery('#' + imgId + 'upload-error').addClass('upload-error');

                    if (typeof geodir_params.err_max_file_size != 'undefined' && geodir_params.err_max_file_size != '') {
                        msgErr = geodir_params.err_max_file_size;
                    } else {
                        msgErr = 'File size error : You tried to upload a file over %s';
                    }
                    msgErr = msgErr.replace("%s", geodir_plupload_params.upload_img_size);

                    jQuery('#' + imgId + 'upload-error').html(msgErr);
                } else if (files.code == -601) {
                    jQuery('#' + imgId + 'upload-error').addClass('upload-error');

                    if (typeof geodir_params.err_file_type != 'undefined' && geodir_params.err_file_type != '') {
                        msgErr = geodir_params.err_file_type;
                    } else {
                        msgErr = 'File type error. Allowed file types: %s';
                    }
                    if (imgId == 'post_images') {
                        var txtReplace = allowed_exts != '' ? "." + allowed_exts.replace(/,/g, ", .") : '*';
                        msgErr = msgErr.replace("%s", txtReplace);
                    } else {
                        msgErr = msgErr.replace("%s", jQuery("#" + imgId + "_allowed_types").attr('data-exts'));
                    }

                    jQuery('#' + imgId + 'upload-error').html(msgErr);
                } else {
                    jQuery('#' + imgId + 'upload-error').addClass('upload-error');
                    jQuery('#' + imgId + 'upload-error').html(files.message);
                }
            });

            //a file was added in the queue
            //totalImg = geodir_plupload_params.totalImg;
            //limitImg = geodir_plupload_params.image_limit;
            uploader.bind('FilesAdded', function(up, files) {
                var totalImg = parseInt(jQuery("#" + imgId + "totImg").val());
                var limitImg = parseInt(jQuery("#" + imgId + "image_limit").val());
                jQuery('#' + imgId + 'upload-error').html('');
                jQuery('#' + imgId + 'upload-error').removeClass('upload-error');

                if (limitImg && $this.hasClass("plupload-upload-uic-multiple") && limitImg > 0) {
                    if (totalImg >= limitImg && limitImg > 0) {
                        while (up.files.length > 0) {
                            up.removeFile(up.files[0]);
                        } // remove images

                        if (typeof geodir_params.err_file_upload_limit != 'undefined' && geodir_params.err_file_upload_limit != '') {
                            msgErr = geodir_params.err_file_upload_limit;
                        } else {
                            msgErr = 'You have reached your upload limit of %s files.';
                        }
                        msgErr = msgErr.replace("%s", limitImg);

                        jQuery('#' + imgId + 'upload-error').addClass('upload-error');

                        jQuery('#' + imgId + 'upload-error').html(msgErr);
                        return false;
                    }

                    if (up.files.length > limitImg && limitImg > 0) {
                        while (up.files.length > 0) {
                            up.removeFile(up.files[0]);
                        } // remove images

                        if (typeof geodir_params.err_pkg_upload_limit != 'undefined' && geodir_params.err_pkg_upload_limit != '') {
                            msgErr = geodir_params.err_pkg_upload_limit;
                        } else {
                            msgErr = 'You may only upload %s files with this package, please try again.';
                        }
                        msgErr = msgErr.replace("%s", limitImg);

                        jQuery('#' + imgId + 'upload-error').addClass('upload-error');
                        jQuery('#' + imgId + 'upload-error').html(msgErr);
                        return false;
                    }
                }

                $.each(files, function(i, file) {
                    $this.find('.filelist').append('<div class="file" id="' + file.id + '"><b>' + file.name + '</b> (<span>' + plupload.formatSize(0) + '</span>/' + plupload.formatSize(file.size) + ') ' + '<div class="fileprogress"></div></div>');
                });

                up.refresh();
                up.start();
            });

            uploader.bind('UploadProgress', function(up, file) {
                $('#' + file.id + " .fileprogress").width(file.percent + "%");
                $('#' + file.id + " span").html(plupload.formatSize(parseInt(file.size * file.percent / 100)));
            });

            var timer;
            var i = 0;
            var indexes = new Array();
            uploader.bind('FileUploaded', function(up, file, response) {
                //up.removeFile(up.files[0]); // remove images
                var totalImg = parseInt(jQuery("#" + imgId + "totImg").val());
                indexes[i] = up;
                clearInterval(timer);
                timer = setTimeout(function() {
                    //geodir_remove_file_index(indexes);
                }, 1000);
                i++;
                $('#' + file.id).fadeOut();
                response = response["response"];
                // add url to the hidden field
                if ($this.hasClass("plupload-upload-uic-multiple")) {
                    totalImg++;
                    jQuery("#" + imgId + "totImg").val(totalImg);
                    // multiple
                    var v1 = $.trim($("#" + imgId, $('#' + imgId + 'plupload-upload-ui').parent()).val());
                    if (v1) {
                        v1 = v1 + "::" + response;
                    } else {
                        v1 = response;
                    }
                    $("#" + imgId, $('#' + imgId + 'plupload-upload-ui').parent()).val(v1).trigger("change");
                    //console.log(v1);
                } else {
                    // single
                    $("#" + imgId, $('#' + imgId + 'plupload-upload-ui').parent()).val(response + "").trigger("change");
                    //console.log(response);
                }
                // show thumbs
                plu_show_thumbs(imgId);
            });
        });
    }
});

function geodir_esc_entities(str){
    // Check & decode entities.
    str = geodir_decode_entities(str);

    var entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
      };

    return String(str).replace(/[&<>"'`=\/]/g, function(s) {
        return entityMap[s];
    });
}

function geodir_decode_entities(str){
    if (!str) {
        return str;
    }
    var entityMap = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        "&#39;": "'",
        '&#x2F;': '/',
        '&#x60;': '`',
        '&#x3D;': '='
      };

    for (k in entityMap) {
        var pat = new RegExp(k, 'g');
        str = str.replace(pat, entityMap[k]);
    }

    return str;
}

function geodir_remove_file_index(indexes) {
    for (var i = 0; i < indexes.length; i++) {
        if (indexes[i].files.length > 0) {
            indexes[i].removeFile(indexes[i].files[0]);
        }
    }
}

function plu_show_thumbs(imgId) {
    //console.log("plu_show_thumbs");
    var totalImg = parseInt(jQuery("#" + imgId + "totImg").val());
    var limitImg = parseInt(jQuery("#" + imgId + "image_limit").val());
    var $ = jQuery;
    var thumbsC = $("#" + imgId + "plupload-thumbs");
    thumbsC.html("");
    // get urls
    var imagesS = $("#" + imgId, $('#' + imgId + 'plupload-upload-ui').parent()).val();

    var txtRemove = 'Remove';
    if (typeof geodir_params.action_remove != 'undefined' && geodir_params.action_remove != '') {
        txtRemove = geodir_params.action_remove;
    }

    if (!imagesS) { return; }

    var images = imagesS.split("::");

    for (var i = 0; i < images.length; i++) {
        if (images[i] && images[i] != 'null') {

            var img_arr = images[i].split("|");
            var image_url = img_arr[0];
            var image_id = img_arr[1];
            var image_title = img_arr[2];
            var image_caption = img_arr[3];
            var image_title_html = '';
            var image_caption_html = ''; 

            // fix undefined id
            if (typeof image_id === "undefined") {
                image_id = '';
            }
            // fix undefined title
            if (typeof image_title === "undefined") {
                image_title = '';
            }
            // fix undefined title
            if (typeof image_caption === "undefined") {
                image_caption = '';
            }

            //Esc title and caption
            image_title   = geodir_esc_entities(image_title);
            image_caption = geodir_esc_entities(image_caption);

            var file_ext = image_url.substring(image_url.lastIndexOf('.') + 1);

            file_ext = file_ext.split('?').shift(); // in case the image url has params
			if (file_ext) {
				file_ext = file_ext.toLowerCase();
			}
            var fileNameIndex = image_url.lastIndexOf("/") + 1;
            var dotIndex = image_url.lastIndexOf('.');
            if (dotIndex < fileNameIndex) {
                continue;
            }
            var file_name = image_url.substr(fileNameIndex, dotIndex < fileNameIndex ? loc.length : dotIndex);

            var file_display = '';
            var file_display_class = '';
            if (file_ext == 'jpg' || file_ext == 'jpe' || file_ext == 'jpeg' || file_ext == 'png' || file_ext == 'gif' || file_ext == 'bmp' || file_ext == 'ico' || file_ext == 'webp' || file_ext == 'avif' || file_ext == 'svg') {
                file_display = '<img class="gd-file-info" data-id="' + image_id + '" data-title="' + image_title + '" data-caption="' + image_caption + '" data-src="' + image_url + '" src="' + image_url + '" alt=""  />';
                if(!!image_title.trim()){
                    image_title_html = '<span class="gd-title-preview">' + image_title + '</span>';
                }
                if(!!image_caption.trim()){
                    image_caption_html = '<span class="gd-caption-preview">' + image_caption + '</span>';
                }
            } else {
                var file_type_class = 'fa-file';
                if (file_ext == 'pdf') {
                    file_type_class = 'fa-file-pdf';
                } else if (file_ext == 'zip' || file_ext == 'tar') {
                    file_type_class = 'fa-file-archive';
                } else if (file_ext == 'doc' || file_ext == 'odt') {
                    file_type_class = 'fa-file-word';
                } else if (file_ext == 'txt' || file_ext == 'text') {
                    file_type_class = 'fa-file';
                } else if (file_ext == 'csv' || file_ext == 'ods' || file_ext == 'ots') {
                    file_type_class = 'fa-file-excel';
                } else if (file_ext == 'avi' || file_ext == 'mp4' || file_ext == 'mov') {
                    file_type_class = 'fa-file-video';
                }
                file_display_class = 'file-thumb';
                file_display = '<i title="' + file_name + '" class="fa ' + file_type_class + ' gd-file-info" data-id="' + image_id + '" data-title="' + image_title + '" data-caption="' + image_caption + '" data-src="' + image_url + '" aria-hidden="true"></i>';
            }

            var thumb = $('<div class="thumb ' + file_display_class + '" id="thumb' + imgId + i + '">' +
                image_title_html +
                file_display +
                image_caption_html +
                '<div class="gd-thumb-actions">' +
                '<span class="thumbeditlink" onclick="gd_edit_image_meta(' + imgId + ',' + i + ');"><i class="far fa-edit" aria-hidden="true"></i></span>' +
                '<span class="thumbremovelink" id="thumbremovelink' + imgId + i + '"><i class="fas fa-trash-alt" aria-hidden="true"></i></span>' +
                '</div>' +
                '</div>');

            thumbsC.append(thumb);

            thumb.find(".thumbremovelink").on("click", function() {
                //console.log("plu_show_thumbs-thumbremovelink");
                if (jQuery('#' + imgId + 'plupload-upload-ui').hasClass("plupload-upload-uic-multiple")) {
                    totalImg--; // remove image from total
                    jQuery("#" + imgId + "totImg").val(totalImg);
                }
                jQuery('#' + imgId + 'upload-error').html('');
                jQuery('#' + imgId + 'upload-error').removeClass('upload-error');
                var ki = $(this).attr("id").replace("thumbremovelink" + imgId, "");
                ki = parseInt(ki);
                var kimages = [];
                imagesS = $("#" + imgId, $('#' + imgId + 'plupload-upload-ui').parent()).val();
                images = imagesS.split("::");
                for (var j = 0; j < images.length; j++) {
                    if (j != ki) {
                        kimages[kimages.length] = images[j];
                    }
                }
                $("#" + imgId, $('#' + imgId + 'plupload-upload-ui').parent()).val(kimages.join("::")).trigger("change");
                //console.log("plu_show_thumbs-thumbremovelink-run");
                plu_show_thumbs(imgId);
                return false;
            });

            // Delete images if limit exceeds
            if (limitImg > 0 && !(limitImg > i)) {
                thumb.find(".thumbremovelink").trigger('click');
            }
        }
    }

    if (images.length > 1) {
        //console.log("plu_show_thumbs-sortable");
        thumbsC.sortable({
            update: function(event, ui) {
                var kimages = [];
                thumbsC.find(".gd-file-info").each(function() {
                    kimages[kimages.length] = $(this).data("src") + "|" + $(this).data("id") + "|" + $(this).data("title") + "|" + $(this).data("caption");
                    $("#" + imgId, $('#' + imgId + 'plupload-upload-ui').parent()).val(kimages.join("::")).trigger("change");
                    plu_show_thumbs(imgId);
                    //console.log("plu_show_thumbs-sortable-run");
                });
            }
        });
        thumbsC.disableSelection();
    }

    // we need to run the basics here.
    //console.log("run basics");

    var kimages = [];
    thumbsC.find(".gd-file-info").each(function() {
        kimages[kimages.length] = $(this).data("src") + "|" + $(this).data("id") + "|" + $(this).data("title") + "|" + $(this).data("caption");
        $("#" + imgId, $('#' + imgId + 'plupload-upload-ui').parent()).val(kimages.join("::")).trigger("change");
    });
}

function gd_edit_image_meta(input, order_id) {
    var imagesS = jQuery("#" + input.id, jQuery('#' + input.id + 'plupload-upload-ui').parent()).val();
    var images = imagesS.split("::");
    var img_arr = images[order_id].split("|");
    var image_title = geodir_esc_entities(img_arr[2]);
    var image_caption = geodir_esc_entities(img_arr[3]);
    var html = '';

    html = html + "<div class='gd-modal-text'><label for='gd-image-meta-title'>" + geodir_params.label_title + "</label><input id='gd-image-meta-title' value='" + image_title + "'></div>"; // title value
    html = html + "<div class='gd-modal-text'><label for='gd-image-meta-caption'>" + geodir_params.label_caption + "</label><input id='gd-image-meta-caption' value='" + image_caption + "'></div>"; // caption value
    html = html + "<div class='gd-modal-button'><button class='button button-primary button-large' onclick='gd_set_image_meta(\"" + input.id + "\"," + order_id + ")'>" + geodir_params.button_set + "</button></div>"; // caption value
    jQuery('#gd_image_meta_' + input.id).html(html);
    lity('#gd_image_meta_' + input.id);

}

function gd_set_image_meta(input_id, order_id) {
    //alert(order_id);
    var imagesS = jQuery("#" + input_id, jQuery('#' + input_id + 'plupload-upload-ui').parent()).val();
    var images = imagesS.split("::");
    var img_arr = images[order_id].split("|");
    var image_url = img_arr[0];
    var image_id = img_arr[1];
    var image_title = geodir_esc_entities(jQuery('#gd_image_meta_' + input_id + ' #gd-image-meta-title').val());
    var image_caption = geodir_esc_entities(jQuery('#gd_image_meta_' + input_id + ' #gd-image-meta-caption').val());
    images[order_id] = image_url + "|" + image_id + "|" + image_title + "|" + image_caption;
    imagesS = images.join("::");
    jQuery("#" + input_id, jQuery('#' + input_id + 'plupload-upload-ui').parent()).val(imagesS).trigger("change");
    plu_show_thumbs(input_id);
    jQuery('[data-lity-close]', window.parent.document).trigger('click');
}