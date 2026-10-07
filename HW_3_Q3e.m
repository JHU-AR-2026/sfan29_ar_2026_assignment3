% AR_HW3_Q3_Francis_Fan
% Oct_6th_2026

clc
clear
close all

% Parameters
W = 800;
H = 600;
n = 0.2;
f = 20.0;

fx = 800.0;
fy = 800.0;
ox = 400.0;
oy = 400.0;

% Input
P_c = [0.3; -0.15; -6.0; 1.0];

% Computation
[M_proj, P_ndc, uv] = compute_pixel_coords(P_c, W, H, n, f, fx, fy, ox, oy);

% Result
fprintf('  Q3 Numerical Results\n');

fprintf('Symbolic / Numerical Projection Matrix (M_proj):\n');
disp(M_proj);

fprintf('Normalized Device Coordinates (NDC):\n');
fprintf('  x_ndc = %.4f\n', P_ndc(1));
fprintf('  y_ndc = %.4f\n', P_ndc(2));
fprintf('  z_ndc = %.4f\n\n', P_ndc(3));

fprintf('Viewport Pixel Coordinates (uv):\n');
fprintf('  u = %.2f px\n', uv(1));
fprintf('  v = %.2f px\n', uv(2));


%% Function
function [M_proj, P_ndc, uv] = compute_pixel_coords(P_c, W, H, n, f, fx, fy, ox, oy)
    P_c = P_c(:);
    if length(P_c) == 3
        P_c = [P_c; 1.0];
    end

    % OpenGL Projection Matrix (Q3.a & Q3.b)
    M_proj = [
        (2.0 * fx) / W,  0.0,             (2.0 * ox - W) / W,     0.0;
        0.0,             (2.0 * fy) / H,  (2.0 * oy - H) / H,     0.0;
        0.0,             0.0,            -(f + n) / (f - n),     -(2.0 * f * n) / (f - n);
        0.0,             0.0,            -1.0,                    0.0
    ];

    % Transform to Clip-space coordinates
    P_clip = M_proj * P_c;

    % Perspective division to NDC (Q3.c)
    W_clip = P_clip(4);
    P_ndc = P_clip(1:3) / W_clip;
    x_ndc = P_ndc(1);
    y_ndc = P_ndc(2);

    % Convert to Pixel Coordinates (Q3.d)
    u = 0.5 * (x_ndc + 1.0) * W;
    v = 0.5 * (y_ndc + 1.0) * H;
    uv = [u; v];
end