package com.parkee.parkingpos.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class RootController {

    @GetMapping("/")
    public String handleRootRequest() {
        return "redirect:/swagger-ui.html";
    }
}