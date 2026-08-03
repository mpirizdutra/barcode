// Este script se carga en todas las páginas
document.addEventListener('alpine:init', () => {
    Alpine.data('uiManager', () => ({
        isFullscreen: false,

        init() {
            // Detecta cambios de pantalla completa (F11 o Botón)
            document.addEventListener('fullscreenchange', () => {
                this.isFullscreen = !!document.fullscreenElement;
            });
        },

        toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error("Error al entrar en modo pantalla completa", err);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        }
    }));


});