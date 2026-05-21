import { supabase } from "../lib/supabase";
import { authStore } from "../lib/authStore";

// Obtener botón SIN usar "as"
const studentBtn =
document.getElementById("studentBtn");

authStore.subscribe((user)=>{

    if(!(studentBtn instanceof HTMLButtonElement))
        return;

    if(user){

        studentBtn.classList.add(
            "hidden"
        );

    }else{

        studentBtn.classList.remove(
            "hidden"
        );

    }

});


if(
    studentBtn instanceof HTMLButtonElement
){

    studentBtn.addEventListener(

        "click",

        async()=>{

            await supabase.auth.signInWithOAuth({

                provider:"google",

                options:{

                    redirectTo:
                    window.location.origin

                }

            });

        }

    );

}