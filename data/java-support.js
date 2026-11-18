/* ==========================================================================
   java-support — preludio Java
   Clases de apoyo que se anteponen al código del alumno antes de compilar
   (necesarias, por ejemplo, para el reto "instanciarObjetoAlumno").
   Nota: en un solo fichero fuente solo puede haber UNA clase pública,
   por eso Alumno es de paquete (sin 'public').
   ========================================================================== */

export const JAVA_PRELUDE = `
class Alumno {
    private String nombre;
    private String ciclo;

    public Alumno(String nombre, String ciclo) {
        this.nombre = nombre;
        this.ciclo = ciclo;
    }

    public String getNombre() { return nombre; }
    public String getCiclo() { return ciclo; }
}
`;
