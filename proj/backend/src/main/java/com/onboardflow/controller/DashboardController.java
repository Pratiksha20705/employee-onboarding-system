package com.onboardflow.controller;

import com.onboardflow.service.DashboardService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return dashboardService.getSummary();
    }

    @GetMapping("/pipeline")
    public Map<String, Object> pipeline() {
        return dashboardService.getPipeline();
    }
}
