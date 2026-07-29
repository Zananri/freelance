(function ($) {
    "use strict";

    const appUrl = $('meta[name="app-url"]').attr("content") || "";
    let selectedStatus = "ALL";

    function escapeHtml(value) {
        return $("<div>").text(value == null ? "" : String(value)).html();
    }

    function loadDepartments() {
        const $body = $("#departmentReadonlyTableBody");

        $body.html(
            '<tr><td colspan="4" class="text-center text-secondary py-4">Loading...</td></tr>'
        );

        $.ajax({
            url: appUrl + "/department/index",
            type: "GET",
            data: {
                query: $("#departmentSearchInput").val() || "",
                status: selectedStatus,
            },
            success: function (response) {
                const departments = response.data || [];

                if (!departments.length) {
                    $body.html(
                        '<tr><td colspan="4" class="text-center text-secondary py-4">No Data</td></tr>'
                    );
                    return;
                }

                const html = departments
                    .map(function (department) {
                        const status = department.status || "INACTIVE";
                        const image = department.image_url
                            ? '<img src="' + escapeHtml(department.image_url) +
                              '" alt="Department" class="table-image">'
                            : '<span class="material-symbols-outlined text-secondary">corporate_fare</span>';

                        return (
                            "<tr>" +
                            "<td>" + image + "</td>" +
                            "<td>" + escapeHtml(department.name_department || "-") + "</td>" +
                            "<td>" + escapeHtml(department.description || "-") + "</td>" +
                            '<td><span class="status-' + escapeHtml(status) + '">' +
                            escapeHtml(status) + "</span></td>" +
                            "</tr>"
                        );
                    })
                    .join("");

                $body.html(html);
            },
            error: function () {
                $body.html(
                    '<tr><td colspan="4" class="text-center text-danger py-4">Failed to load departments.</td></tr>'
                );
            },
        });
    }

    $(function () {
        loadDepartments();

        $("#departmentSearchInput").on("input", function () {
            window.clearTimeout(this.departmentSearchTimer);
            this.departmentSearchTimer = window.setTimeout(loadDepartments, 300);
        });

        $(".department-filter").on("click", function (event) {
            event.preventDefault();
            $(".department-filter").removeClass("active");
            $(this).addClass("active");
            selectedStatus = $(this).data("status") || "ALL";
            loadDepartments();
        });
    });
})(jQuery);
